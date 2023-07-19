
function triggerNotification(title:string, body:string) {
  new Notification(title, { body });
}

export const showNotification = (title:string, body:string) => {
  if (!window.Notification) {
    // prevent crash on ios
    return;
  }
  if (Notification.permission === "granted") {
    triggerNotification (title, body);
  } else if (Notification.permission !== "denied"){
    Notification.requestPermission()
      .then((permission) => {
        if (permission === 'granted') {
          showNotification(title, body);
        }
    })
  }
}
