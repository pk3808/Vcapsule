"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RefreshCcw } from "lucide-react";

export function AuthModal({ isOpen, onOpenChange }) {
  const { login, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [avatarSeed, setAvatarSeed] = useState("");

  const generateNewAvatar = () => {
    // Explicitly generate a random string we can append to force a new avatar
    setAvatarSeed(Math.random().toString(36).substring(7));
  };

  const currentAvatarUrl = `https://api.dicebear.com/7.x/notionists/svg?seed=${username}${avatarSeed}`;

  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!email || !password) return;

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username) {
           setErrorMsg("Username is required.");
           return;
        }
        await register(email, password, username, currentAvatarUrl);
      }
      onOpenChange(false);
    } catch (err) {
      setErrorMsg(err.message || "An error occurred");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card border-none shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold tracking-tight">
            {isLogin ? "Welcome back" : "Create an account"}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {isLogin
              ? "Enter your email and password to sign in."
              : "Enter your details to get started."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {errorMsg && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {errorMsg}
            </div>
          )}
          {!isLogin && (
            <div className="space-y-4 mb-2">
              <div className="flex flex-col items-center justify-center space-y-3 p-4 bg-muted/50 rounded-xl border border-border/50">
                <Label className="text-muted-foreground text-xs uppercase tracking-wider font-semibold">Your Avatar</Label>
                <div className="relative group">
                  <Avatar className="w-20 h-20 border-4 border-background shadow-sm bg-primary/5">
                    <AvatarImage src={currentAvatarUrl} alt="Avatar Preview" />
                    <AvatarFallback>{(username || "U").charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full shadow-md hover:bg-primary hover:text-primary-foreground transition-all"
                    onClick={generateNewAvatar}
                    title="Generate new avatar"
                  >
                    <RefreshCcw className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="vibe_master"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required={!isLogin}
                  className="bg-background border-border/50 focus-visible:ring-primary/30"
                />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-background border-border/50 focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-background border-border/50 focus-visible:ring-primary/30"
            />
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md transition-all">
            {isLogin ? "Sign In" : "Register"}
          </Button>
          <div className="text-center mt-4">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              {isLogin
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
