import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import Header from '@/components/Header';
import { apiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNext = async () => {
    if (phoneNumber.length !== 10) {
      toast({
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit phone number",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.login(phoneNumber);

      if (response.success) {
        toast({
          title: "OTP Sent",
          description: response.message,
        });

        // Navigate to OTP verification with phone number and login type
        navigate('/otp-verify', {
          state: {
            phoneNumber: response.mobileNumber || phoneNumber,
            type: 'login'
          }
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="px-6 pt-12">
        <div className="w-full max-w-md mx-auto text-center">
          {/* Title */}
          <h1 className="text-2xl font-semibold text-foreground mb-2">
            Sign-up or Sign-in
          </h1>

          {/* Subtitle */}
          <p className="text-muted-foreground mb-12">
            Join Over A Million Active Players
          </p>

          {/* Phone Number Input */}
          <div className="mb-8">
            <div className="flex w-full">
              <div className="flex items-center px-3 py-2 bg-muted border border-r-0 rounded-l-lg text-muted-foreground font-bold min-w-[60px] h-12">
                +91
              </div>
              <Input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  if (value.length <= 10) {
                    setPhoneNumber(value);
                  }
                }}
                className="rounded-l-none border-l-0 py-2 px-3 text-base h-12 flex-1"
                placeholder="Enter phone number"
                maxLength={10}
              />
            </div>
          </div>

          {/* Next Button */}
          <div className="mb-12">
            <Button
              variant="otp"
              size="lg"
              onClick={handleNext}
              className="w-full py-4 text-base font-semibold h-12"
              disabled={phoneNumber.length !== 10 || isLoading}
            >
              {isLoading ? 'SENDING...' : 'NEXT'}
            </Button>
          </div>

          {/* Terms and Conditions */}
          <div className="px-4">
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              By continuing, I hereby confirm that I am 18 years of age or above and I am not playing from Assam, Telangana, Nagaland, Andhra Pradesh, Sikkim and outside India and I agree to the{' '}
              <a href="/terms" className="text-link-blue hover:underline">
                Terms and Conditions
              </a>
              {' '}and{' '}
              <a href="#" className="text-link-blue hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* Sign Up Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-link-blue hover:underline font-semibold">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;

