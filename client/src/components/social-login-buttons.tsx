import { Button } from "@/components/ui/button";
import { FaGoogle, FaApple, FaFacebook, FaMicrosoft } from "react-icons/fa";

interface SocialLoginButtonsProps {
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
  onFacebookLogin?: () => void;
  onMicrosoftLogin?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function SocialLoginButtons({
  onGoogleLogin,
  onAppleLogin,
  onFacebookLogin,
  onMicrosoftLogin,
  isLoading = false,
  disabled = false
}: SocialLoginButtonsProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {onGoogleLogin && (
          <Button
            variant="outline"
            onClick={onGoogleLogin}
            disabled={isLoading || disabled}
            className="w-full"
          >
            <FaGoogle className="mr-2 h-4 w-4" />
            Google
          </Button>
        )}

        {onAppleLogin && (
          <Button
            variant="outline"
            onClick={onAppleLogin}
            disabled={isLoading || disabled}
            className="w-full"
          >
            <FaApple className="mr-2 h-4 w-4" />
            Apple
          </Button>
        )}

        {onFacebookLogin && (
          <Button
            variant="outline"
            onClick={onFacebookLogin}
            disabled={isLoading || disabled}
            className="w-full"
          >
            <FaFacebook className="mr-2 h-4 w-4" />
            Facebook
          </Button>
        )}

        {onMicrosoftLogin && (
          <Button
            variant="outline"
            onClick={onMicrosoftLogin}
            disabled={isLoading || disabled}
            className="w-full"
          >
            <FaMicrosoft className="mr-2 h-4 w-4" />
            Microsoft
          </Button>
        )}
      </div>

      <p className="text-xs text-center text-muted-foreground">
        By continuing, you agree to our Terms of Service and Privacy Policy
      </p>
    </div>
  );
}
