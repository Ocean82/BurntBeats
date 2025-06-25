
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TermsOfService() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="bg-dark-card border-gray-800">
        <CardHeader>
          <CardTitle className="text-vibrant-orange text-3xl">Terms of Service & Licensing Agreement</CardTitle>
        </CardHeader>
        <CardContent className="text-gray-300 space-y-6">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Burnt Beats Commercial Music Licensing</h2>
            <p>
              By purchasing a license from Burnt Beats, you receive full commercial rights to the generated music track. 
              This includes streaming, distribution, synchronization, and monetization rights.
            </p>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-vibrant-orange mb-2">What You Get</h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>Perpetual, worldwide commercial use license</li>
              <li>Rights for streaming platforms (Spotify, Apple Music, YouTube, etc.)</li>
              <li>Distribution and sale rights</li>
              <li>Synchronization rights for video, film, and advertising</li>
              <li>Live performance rights</li>
            </ul>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-vibrant-orange mb-2">Pricing Tiers</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold text-yellow-400">Bonus - $3</h4>
                <p className="text-sm">MP3 128kbps + Demo license</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold text-blue-400">Base - $8</h4>
                <p className="text-sm">MP3 320kbps + Full commercial license</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <h4 className="font-bold text-purple-400">Top - $15</h4>
                <p className="text-sm">WAV 24-bit/96kHz + Premium license + Stems</p>
              </div>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-vibrant-orange mb-2">Contact Information</h3>
            <div className="bg-gray-800 p-4 rounded-lg">
              <p><strong>Business:</strong> Burnt Beats</p>
              <p><strong>Website:</strong> https://burnt-beats-sammyjernigan.replit.app</p>
              <p><strong>Email:</strong> support@burntbeats.app</p>
              <p><strong>Social:</strong> @burntbeatsmusic</p>
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-vibrant-orange mb-2">License Verification</h3>
            <p>
              All licenses include a unique ID and can be verified at: 
              <code className="bg-gray-800 px-2 py-1 rounded ml-2">https://burntbeats.app/verify/[LICENSE-ID]</code>
            </p>
          </section>

          <section className="text-sm text-gray-400">
            <p>Last updated: {new Date().toLocaleDateString()}</p>
            <p>© {new Date().getFullYear()} Burnt Beats. All rights reserved.</p>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
