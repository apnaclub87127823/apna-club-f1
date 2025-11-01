import { Wrench, Clock, Mail } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8 md:p-12 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-primary/10 p-6 rounded-full">
                <Wrench className="w-16 h-16 text-primary" />
              </div>
            </div>
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Website Temporarily Closed
          </h1>

          {/* Description */}
          <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
            Yeh website temporarily band kar di gayi hai kyunki website owner ne
            payment complete nahi kiya hai.  
            Jald hi service wapas start ki jayegi jab payment confirm ho jayega.
          </p>

          {/* Info Cards */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-background/50 border border-border rounded-lg p-4">
              <Clock className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground mb-1">Reason</p>
              <p className="text-sm text-muted-foreground">
                Payment not completed by owner
              </p>
            </div>

            <div className="bg-background/50 border border-border rounded-lg p-4">
              <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="font-semibold text-foreground mb-1">Need Help?</p>
              <p className="text-sm text-muted-foreground">
                Contact site administrator
              </p>
            </div>
          </div>

          {/* Footer Message */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground font-medium">
              Kripya samajh ke liye dhanyavaad 🙏
            </p>
          </div>
        </div>

        {/* Bottom Note */}
        <p className="text-center text-muted-foreground text-sm mt-6">
          Please check back later once payment is completed by the owner.
        </p>
      </div>
    </div>
  );
};

export default Maintenance;
