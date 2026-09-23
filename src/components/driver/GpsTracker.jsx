import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Navigation, MapPin, Play, Square, Radar } from "lucide-react";

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function GpsTracker({ shift, driver, onUpdated }) {
  const { toast } = useToast();
  const [tracking, setTracking] = useState(false);
  const [distance, setDistance] = useState(shift?.km_driven || 0);
  const [lastPos, setLastPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  const watchIdRef = useRef(null);
  const saveTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null)
        navigator.geolocation.clearWatch(watchIdRef.current);
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "GPS not supported",
        description: "Your device doesn't support  GPS tracking",
        variant: "destructive",
      });
      return;
    }
    setTracking(true);
    toast({
      title: "GPS tracking started",
      description: "Distance will be  calculated using phone GPS",
    });

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, heading } = pos.coords;
        setCurrentPos({
          lat: latitude,
          lon: longitude,
          speed: speed || 0,
          heading: heading || 0,
        });

        if (lastPos) {
          const d = haversine(lastPos.lat, lastPos.lon, latitude, longitude);
          if (d > 0.01) {
            setDistance((prev) => {
              const newDist = prev + d;
              return newDist;
            });
          }
        }
        setLastPos({ lat: latitude, lon: longitude });
      },
      (err) => {
        toast({
          title: "GPS error",
          description: err.message,
          variant: "destructive",
        });
        setTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );

    // Auto-save distance every 2 minutes
    saveTimerRef.current = setInterval(async () => {
      if (shift) {
        try {
          await base44.entities.ShiftLog.update(shift.id, {
            km_driven: Math.round(distance),
          });
        } catch (e) {
          /* non-critical */
        }
      }
    }, 120000);
  };

  const stopTracking = async () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (saveTimerRef.current) {
      clearInterval(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    setTracking(false);

    // Save final distance
    if (shift) {
      try {
        await base44.entities.ShiftLog.update(shift.id, {
          km_driven: Math.round(distance),
        });
        toast({
          title: "GPS tracking stopped",
          description: `${Math.round(distance)} 
km recorded for this shift`,
        });
        onUpdated?.();
      } catch (e) {
        toast({
          title: "Error saving distance",
          description: e.message,
          variant: "destructive",
        });
      }
    }
  };

  const speedKmh = currentPos?.speed ? Math.round(currentPos.speed * 3.6) : 0;

  return (
    <Card className="border-border/60 shadow-sm">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-brand-navy">
          <Navigation size={16} />
          <p className="text-sm font-semibold">Phone GPS Distance Tracking</p>
          {tracking ? (
            <Badge className="bg-emerald-100 text-emerald-700 text-[10px] gap-1">
              <Radar size={10} className="animate-pulse" /> Live
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px]">
              Off
            </Badge>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Distance Driven</p>
            <p className="font-display text-2xl font-bold  text-brand-navy">
              {distance.toFixed(1)}
            </p>
            <p className="text-[10px] text-muted-foreground">km</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Current Speed</p>
            <p className="font-display text-2xl font-bold text-brand-navy">
              {speedKmh}
            </p>
            <p className="text-[10px] text-muted-foreground">km/h</p>
          </div>
        </div>
        {currentPos && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} />
            <span>
              {currentPos.lat.toFixed(5)}, {currentPos.lon.toFixed(5)}
            </span>
          </div>
        )}
        {!tracking ? (
          <Button
            onClick={startTracking}
            className="w-full gap-2 bg-brand-teal  hover:bg-brand-teal/90"
          >
            <Play size={16} /> Start GPS Tracking
          </Button>
        ) : (
          <Button
            onClick={stopTracking}
            variant="outline"
            className="w-full gap-2  border-rose-300 text-rose-600 hover:bg-rose-50"
          >
            <Square size={16} /> Stop & Save
          </Button>
        )}
        <p className="text-[10px] text-muted-foreground">
          GPS tracking uses your phone's location to calculate distance driven.
          This replaces telematics for TAT, fuel, and breakdown reporting when
          no telematics provider is connected. Distance auto-saves every 2
          minutes.{" "}
        </p>{" "}
      </CardContent>{" "}
    </Card>
  );
}
