// sos.js — לוגיקת SOS שומרים

async function triggerSOS(session, urgency, photoFile) {
  // קבלת מיקום
  let lat = null, lng = null;
  try {
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 })
    );
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
  } catch (e) {
    console.warn('מיקום לא זמין:', e);
  }

  // העלאת תמונה אם יש
  let photo_url = null;
  if (photoFile) {
    const fileName = `sos_${Date.now()}_${session.id}.jpg`;
    const { data: uploadData, error: uploadError } = await _supabase.storage
      .from('shomrim-photos')
      .upload(fileName, photoFile, { upsert: true });
    if (!uploadError) {
      const { data: urlData } = _supabase.storage.from('shomrim-photos').getPublicUrl(fileName);
      photo_url = urlData.publicUrl;
    }
  }

  // שמירת אירוע SOS
  const { data: event, error } = await _supabase
    .from('shomrim_sos_events')
    .insert([{
      child_id: session.id,
      lat,
      lng,
      urgency,
      photo_url,
      status: 'open'
    }])
    .select()
    .single();

  if (error || !event) {
    console.error('שגיאה ביצירת SOS:', error);
    return;
  }

  // שמירת event id גלובלי
  currentEventId = event.id;

  // האזנה בזמן אמת למגיבים
  realtimeChannel = _supabase
    .channel('responders_' + event.id)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'shomrim_responders',
      filter: `event_id=eq.${event.id}`
    }, async () => {
      // ספירת מגיבים
      const { count } = await _supabase
        .from('shomrim_responders')
        .select('*', { count: 'exact', head: true })
        .eq('event_id', event.id)
        .eq('status', 'coming');
      updateResponders(count || 0);
    })
    .subscribe();

  // עדכון מיקום חי
  startLocationUpdates(session.id);
}

let locationInterval = null;

function startLocationUpdates(userId) {
  if (!navigator.geolocation) return;
  locationInterval = setInterval(() => {
    navigator.geolocation.getCurrentPosition(async pos => {
      await _supabase.from('shomrim_locations').upsert({
        user_id: userId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
    });
  }, 5000);
}

function stopLocationUpdates() {
  if (locationInterval) clearInterval(locationInterval);
}
