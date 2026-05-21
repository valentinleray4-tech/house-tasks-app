// Écouter l'événement push envoyé par le serveur
self.addEventListener('push', function (e) {
    const data = e.data ? e.data.json() : { title: "Nouvelle tâche", body: "Une action a été requise !" };

    const options = {
        body: data.body,
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: '2'
        }
    };

    e.waitUntil(
        self.registration.showNotification(data.title, options)
    );
});