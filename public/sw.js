self.addEventListener('push', function (e) {
    let data = { title: "Notification", body: "Nouvelle activité" }; // Valeur par défaut

    if (e.data) {
        try {
            data = e.data.json(); // Essaye de parser le JSON
        } catch (err) {
            data.body = e.data.text(); // Si ce n'est pas du JSON, prend le texte brut
        }
    }

    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100]
    };

    e.waitUntil(
        self.registration.showNotification(data.title || "Rappel", options)
    );
});
