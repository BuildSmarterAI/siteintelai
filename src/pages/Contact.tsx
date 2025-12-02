import { Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const Contact = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A0F2C] via-[#11224F] to-[#0A0F2C]">
      <div className="container mx-auto px-6 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-white mb-6 text-center">
            Get in <span className="text-[#FF7A00]">Touch</span>
          </h1>
          <p className="text-xl text-white/80 mb-12 text-center">
            Questions about SiteIntel? We're here to help.
          </p>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Contact Info */}
            <div className="space-y-6">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <Mail className="h-8 w-8 text-[#06B6D4] mb-3" />
                <h3 className="text-lg font-heading font-semibold text-white mb-2">Email Us</h3>
                <p className="text-white/70">support@siteintel.ai</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <Phone className="h-8 w-8 text-[#FF7A00] mb-3" />
                <h3 className="text-lg font-heading font-semibold text-white mb-2">Call Us</h3>
                <p className="text-white/70">1-800-BUILD-AI</p>
              </div>

              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <MessageSquare className="h-8 w-8 text-[#06B6D4] mb-3" />
                <h3 className="text-lg font-heading font-semibold text-white mb-2">Live Chat</h3>
                <p className="text-white/70">Available Mon-Fri, 9am-6pm EST</p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
              <form className="space-y-4">
                <div>
                  <Input
                    placeholder="Your Name"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Input
                    type="email"
                    placeholder="Your Email"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Input
                    placeholder="Subject"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  />
                </div>
                <div>
                  <Textarea
                    placeholder="Your Message"
                    rows={5}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 resize-none"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#FF7A00] to-[#FF9240] hover:shadow-[0_6px_30px_rgba(255,122,0,0.6)] text-white font-semibold rounded-full"
                >
                  Send Message
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;