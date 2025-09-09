import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Heart, 
  Camera, 
  QrCode, 
  Download, 
  Clock, 
  Users, 
  Sparkles,
  CheckCircle,
  ArrowRight,
  Smartphone,
  Gift
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Heart className="h-8 w-8 text-pink-500" />
              <h1 className="text-2xl font-bold text-gray-900">EventFlow</h1>
            </div>
            <Button onClick={onGetStarted} variant="outline">
              Log ind
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4 bg-pink-100 text-pink-800">
              <Sparkles className="h-4 w-4 mr-1" />
              For brudepar & event arrangører
            </Badge>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Få gæsternes bryllupsbilleder – 
            <span className="text-pink-600"> uden jagten bagefter</span>
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto">
            En QR-kode på bordet – og dine gæster uploader deres billeder direkte til jer. 
            Ingen login. Ingen app. Bare ægte minder samlet ét sted.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              onClick={onGetStarted} 
              size="lg" 
              className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-3"
            >
              <Heart className="h-5 w-5 mr-2" />
              Opret Gratis Event
            </Button>
            <Button variant="outline" size="lg" className="px-8 py-3">
              Se demo
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Sådan virker det – 3 simple trin
            </h2>
            <p className="text-xl text-gray-600">
              Fra oprettelse til downloadede minder på under 5 minutter
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-pink-600" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  1. Opret en event på 3 minutter
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Du vælger dato, tid og tema – og får automatisk din QR-kode.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <QrCode className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  2. Del QR-koden med gæsterne
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Sæt den på bordkort, plakater eller invitationer. Gæsterne scanner og uploader – nemt og hurtigt.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Download className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-xl font-semibold">
                  3. Få alle billederne samlet ét sted
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">
                  Se, sorter, download og gem dine yndlings øjeblikke – også dem fotografen missede.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-gradient-to-r from-pink-50 to-purple-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Hvorfor vælge os?
            </h2>
            <p className="text-xl text-gray-600">
              Fordi jeres bryllupsdag fortjener alle de smukke øjeblikke
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Få spontane, ægte billeder fra dine gæster
                </h3>
                <p className="text-gray-600 text-sm">
                  De øjeblikke fotografen ikke fanger – gæsternes perspektiv
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Slip for at skrive til alle efter festen
                </h3>
                <p className="text-gray-600 text-sm">
                  Ingen jagten på billeder i grupper eller beskeder
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Alt er samlet ét sted – intet teknisk bøvl
                </h3>
                <p className="text-gray-600 text-sm">
                  Simpel løsning der bare virker, uden installation
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Gratis prøveperiode – oplev det før I beslutter jer
                </h3>
                <p className="text-gray-600 text-sm">
                  Test løsningen risikofrit til jeres store dag
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Perfekt supplement til fotografen
                </h3>
                <p className="text-gray-600 text-sm">
                  Få både de professionelle og de spontane minder
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4 bg-white p-6 rounded-lg shadow-sm">
              <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  Ubegrænsede uploads fra alle gæster
                </h3>
                <p className="text-gray-600 text-sm">
                  Ingen begrænsninger på antallet af billeder
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Journey Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Så nemt er det at få dine gæsters billeder
            </h2>
            <p className="text-xl text-gray-600">
              KUNDEREJSEN – 4 simple trin
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                  <span className="text-pink-600 font-bold text-lg">1</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Opret dit event
                  </h3>
                  <p className="text-gray-600">
                    Giv dit bryllup et navn, vælg dato og få din QR-kode med det samme
                  </p>
                </div>
                <div className="hidden md:block">
                  <Heart className="h-8 w-8 text-pink-400" />
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-bold text-lg">2</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Print og del QR-koden
                  </h3>
                  <p className="text-gray-600">
                    Læg den på bordene, plakater eller send QR koden digitalt
                  </p>
                </div>
                <div className="hidden md:block">
                  <QrCode className="h-8 w-8 text-purple-400" />
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-lg">3</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Gæsterne scanner og uploader
                  </h3>
                  <p className="text-gray-600">
                    De tager billeder og uploader dem direkte fra deres mobil – ingen login eller app
                  </p>
                </div>
                <div className="hidden md:block">
                  <Smartphone className="h-8 w-8 text-blue-400" />
                </div>
              </div>

              <div className="flex items-start space-x-6">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-bold text-lg">4</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Se og gem dine minder
                  </h3>
                  <p className="text-gray-600">
                    Download, sortér, marker favoritter – og del med dine nærmeste
                  </p>
                </div>
                <div className="hidden md:block">
                  <Download className="h-8 w-8 text-green-400" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Vælg den løsning, der passer jer
            </h2>
            <p className="text-xl text-gray-600">
              Fleksible muligheder til jeres perfekte dag
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="text-center shadow-lg bg-white">
              <CardHeader>
                <Gift className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Gratis Demo</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Test alle funktioner risikofrit
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg bg-white">
              <CardHeader>
                <Clock className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Månedlig Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Fleksibel løsning til enkelt events
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg bg-white">
              <CardHeader>
                <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Årlig Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Bedste værdi til flere events
                </p>
              </CardContent>
            </Card>

            <Card className="text-center shadow-lg bg-white">
              <CardHeader>
                <Camera className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                <CardTitle className="text-lg">Premium Tilvalg</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 text-sm">
                  Fotobog, backup og mere
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8">
            <p className="text-lg text-gray-600 mb-4">
              ✓ Ubegrænsede billeder  ✓ Ingen skjulte gebyrer  ✓ Support på dansk
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-pink-600 to-purple-600 py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Klar til at samle alle jeres bryllupsbilleder?
          </h2>
          <p className="text-xl text-pink-100 mb-8 max-w-2xl mx-auto">
            Opret jeres første event nu og oplev hvor nemt det er at få alle gæsternes minder samlet ét sted.
          </p>
          <Button 
            onClick={onGetStarted}
            size="lg" 
            className="bg-white text-pink-600 hover:bg-gray-100 px-8 py-3 text-lg font-semibold"
          >
            <Heart className="h-5 w-5 mr-2" />
            Start Gratis I Dag
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-500">
            <span>© 2024 EventFlow</span>
            <span>•</span>
            <span>Skabt med ❤️ til brudepar og gæster</span>
          </div>
        </div>
      </footer>
    </div>
  );
}