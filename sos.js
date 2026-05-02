// sos.js — לוגיקת SOS שומרים

let pollingInterval = null;

async function triggerSOS(session, urgency, photoFile) {
  // קבלת מיקום — 3 ניסיונות
  let lat = null, lng = null;
  try {
    // ניסיון 1 — GPS מדויק, 15 שניות
    const pos = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 15000, enableHighAccuracy: true })
    );
    lat = pos.coords.latitude;
    lng = pos.coords.longitude;
  } catch (e) {
    try {
      // ניסיון 2 — מיקום אחרון שמור בזיכרון הטלפון (עד דקה ישן)
      const pos = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 60000, enableHighAccuracy: false })
      );
      lat = pos.coords.latitude;
      lng = pos.coords.longitude;
    } catch (e2) {
      try {
        // ניסיון 3 — רשת סלולרית/wifi, דיוק נמוך אבל עובד בפנים בניין
        const pos = await new Promise((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, maximumAge: 300000, enableHighAccuracy: false })
        );
        lat = pos.coords.latitude;
        lng = pos.coords.longitude;
      } catch (e3) {
        console.warn('מיקום לא זמין לאחר 3 ניסיונות:', e3);
      }
    }
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
      status: 'open',
      school_name: session.school_name || null
    }])
    .select()
    .single();

  if (error || !event) {
    console.error('שגיאה ביצירת SOS:', error);
    return;
  }

  // שמירת event id גלובלי ובsessionStorage
  currentEventId = event.id;
  sessionStorage.setItem('shomrim_active_sos', event.id);

  // polling כל 3 שניות לספירת מגיבים
  startPolling(event.id);

  // עדכון מיקום חי
  startLocationUpdates(session.id);
}

function startPolling(eventId) {
  if (pollingInterval) clearInterval(pollingInterval);
  pollingInterval = setInterval(async () => {
    const { data: responders } = await _supabase
      .from('shomrim_responders')
      .select('parent_name, parent_photo')
      .eq('event_id', eventId)
      .eq('status', 'coming');
    updateResponders(responders || []);
  }, 3000);
}

function stopPolling() {
  if (pollingInterval) clearInterval(pollingInterval);
}

// בדיקה בטעינת הדף — האם יש קריאה פתוחה
async function checkActiveEvent(session) {
  const savedEventId = sessionStorage.getItem('shomrim_active_sos');
  if (!savedEventId) return;

  const { data: event } = await _supabase
    .from('shomrim_sos_events')
    .select('*')
    .eq('id', savedEventId)
    .eq('status', 'open')
    .single();

  if (!event) {
    sessionStorage.removeItem('shomrim_active_sos');
    return;
  }

  // יש קריאה פתוחה — חזרה למצב SOS
  currentEventId = event.id;
  document.getElementById('sosBtn').classList.add('pulsing');
  document.getElementById('statusPanel').classList.add('active');
  startPolling(event.id);
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
