import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { FaApplePay, FaPaypal, FaCreditCard, FaCcVisa, FaCcMastercard } from "react-icons/fa";
import { SiVenmo } from "react-icons/si";
import { toast } from "sonner";
import CreditCardForm from "../components/settings/CreditCardForm";

const ATHENA_OAUTH_URL = "https://identity.athenahealth.com/oauth2/auset0ja9xZ2Hniep296/v1/authorize?client_id=0oaet0rfjNzyKCiQQ296&idp=&login_hint=ANETUSERNAME&nonce=a3626f388ead78088b106fa17935fe91d0b641c1de0e7d34515e3dddaa163b1e&prompt=login&redirect_uri=https%3A%2F%2Fathenanet.athenahealth.com%2F1%2F1%2Flogin%2Foidc.esp&response_mode=form_post&response_type=code&scope=openid%20profile%20offline_access%20&sessionToken=&state=eyJGTEFHUyI6eyJDT0RFUEFTU1RIUk9VR0giOm51bGwsIkFORVRNRkFTSElNV0lER0VUIjoiIiwiTk9GUkFNRVNFVCI6bnVsbCwiREVQQVJUTUVOVElEIjpudWxsLCJERUVQTElOSyI6bnVsbH0sIkxPR0lOTUVUQURBVEEiOnsiVVNFUkFVVEhOVFlQRSI6Ik5PTlNTTyIsIkJBTk5FUlRZUEUiOiJsaXZlX2xvZ2luIn0sIkNTUkYiOiI5ZDk0ZDY0NjkwYWIzMWEwZjRlMGM2MTdkM2FiNjhmNSIsIlRBUkdFVFVSTCI6bnVsbH0";

const PAYPAL_URL = "https://www.paypal.com/signin";
const VENMO_URL = "https://id.venmo.com/signin?country.x=US&locale.x=en&ctxId=AAEGhT1ApIw8mn82gGEmX6ImxJUt6X_kdHmOoFDfMHa9TgQ6wsibulSX1z2fhmRV1iv2jZdxYKntM6uKWvBp6H8=#/lgn";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("integrations");
  const [isAthenaConnected, setIsAthenaConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const [cardPreview, setCardPreview] = useState(null);
  const [paypalConnected, setPaypalConnected] = useState(false);
  const [venmoConnected, setVenmoConnected] = useState(false);
  const [showPayPalMsg, setShowPayPalMsg] = useState(false);
  const [showVenmoMsg, setShowVenmoMsg] = useState(false);

  // Check for Athena OAuth code in URL hash or query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.replace('#', '?'));
    if (params.get('code')) {
      setIsAthenaConnected(true);
      toast.success("Successfully connected to Athena");
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Simulate backend save for card
  const handleCardSuccess = (cardData) => {
    if (!cardData || !cardData.cardNumber) {
      toast.error("Card data is missing!");
      return;
    }
    setTimeout(() => {
      setCardPreview({
        last4: cardData.cardNumber.slice(-4),
        brand: cardData.cardNumber.startsWith('4') ? 'Visa' : 'Mastercard',
        cardholder: cardData.cardholderName,
      });
      setShowPaymentForm(false);
      setSelectedPaymentMethod(null);
      toast.success("Card added: **** **** **** " + cardData.cardNumber.slice(-4));
    }, 1200);
  };

  const handlePaymentMethodAdd = (method) => {
    setSelectedPaymentMethod(method);
    setShowPayPalMsg(false);
    setShowVenmoMsg(false);
    if (method === "card") {
      setShowPaymentForm(true);
    } else if (method === "paypal") {
      window.open(PAYPAL_URL, '_blank');
      setPaypalConnected(true);
      setShowPayPalMsg(true);
      toast.info("After completing PayPal login, return to Seismic to finish setup.");
    } else if (method === "venmo") {
      window.open(VENMO_URL, '_blank');
      setVenmoConnected(true);
      setShowVenmoMsg(true);
      toast.info("After completing Venmo login, return to Seismic to finish setup.");
    } else {
      toast.info(`${method} integration coming soon!`);
    }
  };

  const handlePaymentSuccess = (cardData) => {
    handleCardSuccess(cardData);
  };

  const handleRemoveCard = () => {
    setCardPreview(null);
    toast("Card removed");
  };

  const handleRemovePaypal = () => {
    setPaypalConnected(false);
    setShowPayPalMsg(false);
    toast("PayPal disconnected");
  };

  const handleRemoveVenmo = () => {
    setVenmoConnected(false);
    setShowVenmoMsg(false);
    toast("Venmo disconnected");
  };

  const handleAthenaConnect = () => {
    window.open(ATHENA_OAUTH_URL, '_blank');
  };

  const handleReAuth = () => {
    setIsAthenaConnected(false);
    handleAthenaConnect();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>

      <Tabs defaultValue="integrations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="billing">Billing & Payments</TabsTrigger>
        </TabsList>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Athena Integration</CardTitle>
              <CardDescription>
                Connect your Athena account to sync appointments and patient data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isAthenaConnected ? (
                <Button
                  onClick={handleAthenaConnect}
                  disabled={isLoading}
                  className="w-full sm:w-auto"
                >
                  {isLoading ? "Connecting..." : "Connect to Athena"}
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="h-2 w-2 rounded-full bg-green-600"></span>
                  <span>Connected to Athena</span>
                  <Button variant="outline" size="sm" onClick={handleReAuth} className="ml-4">Re-authenticate</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Plan</CardTitle>
                <CardDescription>
                  You are currently on the Professional plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-neutral-500">
                  Next billing date: June 1, 2024
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add a Payment Method</CardTitle>
                <CardDescription>
                  Securely add and manage your payment methods
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Card Preview */}
                {cardPreview && (
                  <div className="flex items-center gap-4 mb-4 p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-900">
                    <div className="flex items-center gap-2">
                      {cardPreview.brand === 'Visa' ? <FaCcVisa className="h-8 w-8 text-blue-600" /> : <FaCcMastercard className="h-8 w-8 text-yellow-600" />}
                      <span className="font-mono text-lg">**** **** **** {cardPreview.last4}</span>
                    </div>
                    <span className="text-neutral-700 dark:text-neutral-200">{cardPreview.cardholder}</span>
                    <Button variant="outline" size="sm" onClick={handleRemoveCard}>Remove</Button>
                  </div>
                )}
                {/* PayPal Connected */}
                {paypalConnected && (
                  <div className="flex items-center gap-4 mb-4 p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-900">
                    <FaPaypal className="h-8 w-8 text-blue-600" />
                    <span className="text-neutral-700 dark:text-neutral-200">PayPal Connected</span>
                    <Button variant="outline" size="sm" onClick={handleRemovePaypal}>Remove</Button>
                  </div>
                )}
                {/* Venmo Connected */}
                {venmoConnected && (
                  <div className="flex items-center gap-4 mb-4 p-4 rounded-lg border bg-neutral-50 dark:bg-neutral-900">
                    <SiVenmo className="h-8 w-8 text-blue-600" />
                    <span className="text-neutral-700 dark:text-neutral-200">Venmo Connected</span>
                    <Button variant="outline" size="sm" onClick={handleRemoveVenmo}>Remove</Button>
                  </div>
                )}
                {/* Payment Options */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 transition-transform hover:scale-105"
                    onClick={() => handlePaymentMethodAdd("card")}
                    disabled={!!cardPreview}
                  >
                    <FaCreditCard className="h-5 w-5" />
                    Credit/Debit Card
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 transition-transform hover:scale-105"
                    onClick={() => handlePaymentMethodAdd("apple")}
                  >
                    <FaApplePay className="h-5 w-5" />
                    Apple Pay
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 transition-transform hover:scale-105"
                    onClick={() => handlePaymentMethodAdd("paypal")}
                    disabled={paypalConnected}
                  >
                    <FaPaypal className="h-5 w-5" />
                    PayPal
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2 transition-transform hover:scale-105"
                    onClick={() => handlePaymentMethodAdd("venmo")}
                    disabled={venmoConnected}
                  >
                    <SiVenmo className="h-5 w-5" />
                    Venmo
                  </Button>
                </div>
                {/* Show PayPal/Venmo message */}
                {showPayPalMsg && (
                  <div className="mt-4 text-sm text-blue-700 dark:text-blue-300">
                    After completing PayPal login, return to Seismic to finish setup.
                  </div>
                )}
                {showVenmoMsg && (
                  <div className="mt-4 text-sm text-blue-700 dark:text-blue-300">
                    After completing Venmo login, return to Seismic to finish setup.
                  </div>
                )}
                {/* Credit Card Form */}
                {showPaymentForm && (
                  <div className="mt-6">
                    <CreditCardForm onSuccess={handlePaymentSuccess} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Settings;
