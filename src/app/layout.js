import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

// 🌟 FUSION DES METADATAS : Un seul bloc propre avec le manifest relié
export const metadata = {
    title: "Tâches de la Maison",
    description: "Gestion des corvées et classement de la maison",
    manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
    return (
        <html
            lang="fr" // Passé en français tant qu'à faire !
            className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
        >
            <body className="min-h-full flex flex-col bg-gray-100">{children}</body>
        </html>
    );
}