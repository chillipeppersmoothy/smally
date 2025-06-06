"use client";

import { FormEvent, useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, LinkIcon, QrCodeIcon, Wand2Icon } from "lucide-react";
import { shortenUrl } from "@/lib/data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { postUrl } from "../api/services";
import { useDataContext } from "../providers/ContextProvider";
import { ShortenedURL } from "../interface/types";
import { API_URL } from "@/lib/env";
import { Calendar } from "./ui/calendar";

export function UrlShortenerForm() {
  const [url, setUrl] = useState("");
  const [currentUser, setCurrentUser] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [isQrCode, setIsQrCode] = useState(false);
  const [isExpiration, setIsExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date>();
  const [formattedExpirationDate, setFormattedExpirationDate] =
    useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [slugError, setSlugError] = useState("");
  const { toast } = useToast();
  const { updateUserData, userDetails } = useDataContext();

  const isValidUrl = (urlString: string) => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  useEffect(() => {
    if (userDetails && userDetails.username) {
      setCurrentUser(userDetails.username);
    }
  }, [userDetails]);

  useEffect(() => {
    if (expirationDate) {
      setFormattedExpirationDate(format(expirationDate, "PPP"));
    } else {
      setFormattedExpirationDate("");
    }
  }, [expirationDate]);

  useEffect(() => {
    if (isCustomSlug || isExpiration) {
      setError("");
      setSlugError("");
      return;
    }
    setSlugError("");
  }, [isCustomSlug, isExpiration, customSlug, expirationDate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!url) {
      setError("Please enter a URL");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a URL",
      });
      return;
    }

    if (!isValidUrl(url)) {
      setError("Please enter a valid URL");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid URL",
      });
      return;
    }

    if (isCustomSlug && !customSlug.length) {
      setSlugError("Please enter a valid slug");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid slug",
      });
      return;
    }

    if (isExpiration && !expirationDate) {
      setSlugError("Please select an expiration date");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select an expiration date",
      });
      return;
    }

    if (!userDetails.isSignedIn) {
      document.getElementById("trigger-sign-in")?.click();
      return;
    }

    setError("");
    setSlugError("");
    setIsSubmitting(true);

    try {
      const urlData: ShortenedURL = await shortenUrl(
        url,
        currentUser,
        isQrCode,
        customSlug,
        expirationDate
      );
      const response = await postUrl(urlData);

      updateUserData({ ...urlData, slug: response.slug, qrCode: response.qr });

      toast({
        variant: "success",
        title: "Success",
        description: "URL shortened successfully!",
      });

      setUrl("");
      setCustomSlug("");
      setIsCustomSlug(false);
      setIsQrCode(false);
      setIsExpiration(false);
      setExpirationDate(undefined);
      setFormattedExpirationDate("");
      setError("");
      setSlugError("");
    } catch (err) {
      setError("Something went wrong. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to shorten URL. Please try again.",
      });
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card
      className="w-full max-w-3xl mx-auto backdrop-blur-sm bg-card/95 mt-24"
      role="region"
      aria-label="URL Shortener Form"
    >
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold" id="form-heading">
              Shorten your URL
            </h2>
            <p className="text-muted-foreground">
              Paste your long URL below to create a short link
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Label htmlFor="url-input" className="sr-only">
                Enter URL to shorten
              </Label>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <LinkIcon
                  className="w-5 h-5 text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
              <Input
                type="url"
                id="url-input"
                placeholder="https://example.com/very/long/url/that/needs/shortening"
                className="pl-10"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={error ? "url-error" : undefined}
                required
              />
            </div>

            <Button
              type="submit"
              className="min-w-[100px] transition-all duration-300"
              disabled={isSubmitting}
              aria-busy={isSubmitting}
            >
              {isSubmitting ? (
                <span className="animate-pulse">Processing...</span>
              ) : (
                <>
                  <Wand2Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  Shorten
                </>
              )}
            </Button>
          </div>

          {error && (
            <div
              className="text-destructive text-sm"
              id="url-error"
              role="alert"
            >
              {error}
            </div>
          )}

          <Tabs defaultValue="options" className="w-full">
            <TabsList
              className="grid w-full grid-cols-3"
              aria-label="URL shortener options"
            >
              <TabsTrigger value="options">Options</TabsTrigger>
              <TabsTrigger value="customization">Customization</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="options" className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="custom-slug">Custom slug</Label>
                  <div
                    className="text-sm text-muted-foreground"
                    id="custom-slug-description"
                  >
                    Create a memorable short link
                  </div>
                </div>
                <Switch
                  id="custom-slug"
                  checked={isCustomSlug}
                  onCheckedChange={setIsCustomSlug}
                  aria-describedby="custom-slug-description"
                />
              </div>

              {isCustomSlug && (
                <div className="pt-2">
                  <Label htmlFor="slug-input" className="sr-only">
                    Enter custom slug
                  </Label>
                  <Input
                    id="slug-input"
                    placeholder="your-custom-slug (Max 8 characters)"
                    value={customSlug}
                    onChange={(e) => setCustomSlug(e.target.value)}
                    maxLength={8}
                    aria-invalid={!!slugError}
                    aria-describedby={slugError ? "slug-error" : "slug-preview"}
                  />
                  <div
                    className="text-xs text-muted-foreground mt-3"
                    id="slug-preview"
                  >
                    Your URL will be: {API_URL}/
                    {customSlug || "your-custom-slug"}
                  </div>
                  {slugError && (
                    <div
                      className="text-destructive text-sm"
                      id="slug-error"
                      role="alert"
                    >
                      {slugError}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="customization" className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5 flex justify-center items-center">
                  <QrCodeIcon className="h-10 w-10" />
                  <div className="pl-2 flex-column">
                    <Label htmlFor="qr-code">QR code</Label>
                    <div className="text-sm text-muted-foreground">
                      Generate a QR code for your short link
                    </div>
                  </div>
                </div>
                <Switch
                  id="qr-code"
                  checked={isQrCode}
                  onCheckedChange={setIsQrCode}
                />
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="space-y-3 pt-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="expiration">Link expiration</Label>
                  <div className="text-sm text-muted-foreground">
                    Set an expiration date for your link
                  </div>
                </div>
                <Switch
                  id="expiration"
                  checked={isExpiration}
                  onCheckedChange={setIsExpiration}
                />
              </div>

              {isExpiration && (
                <div className="pt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !formattedExpirationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formattedExpirationDate || "Select expiration date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={expirationDate}
                        onSelect={setExpirationDate}
                        disabled={(date) => date < new Date()}
                      />
                    </PopoverContent>
                  </Popover>
                  {slugError && (
                    <div
                      className="text-destructive text-sm"
                      id="slug-error"
                      role="alert"
                    >
                      {slugError}
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  );
}
