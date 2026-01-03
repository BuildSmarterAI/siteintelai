/**
 * SiteIntel™ Design Mode - Share Modal (Google Earth Parity)
 * 
 * Full-featured sharing with roles, link access, expiration, and export package.
 * Per UX spec: Matches Google Earth share experience.
 */

import { useState } from "react";
import { useDesignStore } from "@/stores/useDesignStore";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Link2,
  Copy,
  Settings,
  X,
  Check,
  Clock,
  FileText,
  Image,
  Table,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import type { ShareRole, LinkAccess, ShareExpiration } from "@/types/design";

interface ShareModalProps {
  sessionName?: string;
}

export function ShareModal({ sessionName = "Design Session" }: ShareModalProps) {
  const {
    shareModalOpen,
    setShareModalOpen,
    shareSettings,
    setShareSettings,
    shareInvites,
    addShareInvite,
    removeShareInvite,
  } = useDesignStore();

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<ShareRole>("viewer");
  const [linkCopied, setLinkCopied] = useState(false);

  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (shareInvites.some((i) => i.email === inviteEmail)) {
      toast.error("This email has already been invited");
      return;
    }

    addShareInvite({
      email: inviteEmail,
      role: inviteRole,
      invitedAt: new Date().toISOString(),
    });

    setInviteEmail("");
    toast.success(`Invite sent to ${inviteEmail}`);
  };

  const handleCopyLink = async () => {
    const shareUrl = `${window.location.origin}/design/shared/${crypto.randomUUID()}`;
    await navigator.clipboard.writeText(shareUrl);
    setLinkCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const roleLabels: Record<ShareRole, string> = {
    owner: "Owner",
    editor: "Editor",
    viewer: "Viewer",
  };

  const expirationLabels: Record<ShareExpiration, string> = {
    none: "No expiration",
    "7d": "7 days",
    "30d": "30 days",
  };

  return (
    <Dialog open={shareModalOpen} onOpenChange={setShareModalOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            Share Design Session
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShareModalOpen(false)}
            className="h-6 w-6"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          {/* Add people section */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Add people, groups</label>
            <div className="flex gap-2">
              <Input
                placeholder="Email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                className="flex-1"
              />
              <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as ShareRole)}>
                <SelectTrigger className="w-28">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleInvite}>Invite</Button>
            </div>
          </div>

          {/* People with access */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              People with access
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {/* Current user (owner) */}
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">You</p>
                    <p className="text-xs text-muted-foreground">Owner</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">Owner</Badge>
              </div>

              {/* Invitees */}
              {shareInvites.map((invite) => (
                <div
                  key={invite.email}
                  className="flex items-center justify-between py-1.5"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm">{invite.email}</p>
                      {invite.lastViewedAt && (
                        <p className="text-xs text-muted-foreground">
                          Last viewed {new Date(invite.lastViewedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={invite.role}
                      onValueChange={(v) => {
                        removeShareInvite(invite.email);
                        addShareInvite({ ...invite, role: v as ShareRole });
                      }}
                    >
                      <SelectTrigger className="w-24 h-8 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeShareInvite(invite.email)}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* General access section */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              General access
            </label>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Link2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Select
                  value={shareSettings.linkAccess}
                  onValueChange={(v) => setShareSettings({ linkAccess: v as LinkAccess })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="restricted">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Restricted</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="anyone">
                      <div className="flex items-center gap-2">
                        <Link2 className="h-4 w-4" />
                        <span>Anyone with link (View only)</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Expiration */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <Select
                  value={shareSettings.expiration}
                  onValueChange={(v) => setShareSettings({ expiration: v as ShareExpiration })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Link expiration" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(expirationLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Export package options */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-muted-foreground">
              Export package options
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={shareSettings.exportPackage.pdf}
                  onCheckedChange={(checked) =>
                    setShareSettings({
                      exportPackage: {
                        ...shareSettings.exportPackage,
                        pdf: !!checked,
                      },
                    })
                  }
                />
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">PDF snapshot</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={shareSettings.exportPackage.png}
                  onCheckedChange={(checked) =>
                    setShareSettings({
                      exportPackage: {
                        ...shareSettings.exportPackage,
                        png: !!checked,
                      },
                    })
                  }
                />
                <Image className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">PNG views</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={shareSettings.exportPackage.csv}
                  onCheckedChange={(checked) =>
                    setShareSettings({
                      exportPackage: {
                        ...shareSettings.exportPackage,
                        csv: !!checked,
                      },
                    })
                  }
                />
                <Table className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Metrics CSV</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={shareSettings.exportPackage.complianceLog}
                  onCheckedChange={(checked) =>
                    setShareSettings({
                      exportPackage: {
                        ...shareSettings.exportPackage,
                        complianceLog: !!checked,
                      },
                    })
                  }
                />
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Compliance log</span>
              </label>
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handleCopyLink}
              className="gap-2"
            >
              {linkCopied ? (
                <>
                  <Check className="h-4 w-4 text-green-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy link
                </>
              )}
            </Button>
            <Button onClick={() => setShareModalOpen(false)}>Done</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
