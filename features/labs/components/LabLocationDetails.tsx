import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Accessibility,
  Car,
  Clock,
  Coffee,
  ExternalLink,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Wifi,
} from "lucide-react";

interface LabLocation {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  hours: {
    [key: string]: string;
  };
  parking: {
    available: boolean;
    type: string;
    cost: string;
    spaces: number;
    instructions: string;
  };
  amenities: string[];
  accessibility: string[];
  directions: {
    public_transport: string;
    driving: string;
    walking: string;
  };
  notes: string;
}

interface LabLocationDetailsProps {
  location: LabLocation;
  onGetDirections?: (address: string) => void;
}

export const LabLocationDetails = ({
  location,
  onGetDirections,
}: LabLocationDetailsProps) => {
  const fullAddress = `${location.address}, ${location.city}, ${location.state} ${location.zipCode}`;

  const handleGetDirections = () => {
    const encodedAddress = encodeURIComponent(fullAddress);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);

    if (isIOS) {
      window.open(`http://maps.apple.com/?q=${encodedAddress}`, "_blank");
    } else if (isAndroid) {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank",
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`,
        "_blank",
      );
    }

    if (onGetDirections) {
      onGetDirections(fullAddress);
    }
  };

  const getAmenityIcon = (amenity: string) => {
    switch (amenity.toLowerCase()) {
      case "wifi":
        return <Wifi className="h-4 w-4" />;
      case "coffee":
        return <Coffee className="h-4 w-4" />;
      case "security":
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-xl">{location.name}</CardTitle>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>{fullAddress}</span>
              </div>
            </div>
            <Button
              onClick={handleGetDirections}
              className="flex items-center gap-2"
            >
              <Navigation className="h-4 w-4" />
              Get Directions
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Hours & Contact
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4" />
                <span className="font-medium">Phone:</span>
                <a
                  href={`tel:${location.phone}`}
                  className="text-primary hover:underline"
                >
                  {location.phone}
                </a>
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Operating Hours</h4>
              <div className="space-y-1 text-sm">
                {Object.entries(location.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between">
                    <span className="capitalize">{day}:</span>
                    <span>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parking Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              Parking Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-medium">Availability:</span>
              <Badge
                variant={location.parking.available ? "default" : "destructive"}
              >
                {location.parking.available ? "Available" : "Not Available"}
              </Badge>
            </div>

            {location.parking.available && (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Type:</span>
                    <p>{location.parking.type}</p>
                  </div>
                  <div>
                    <span className="font-medium">Cost:</span>
                    <p>{location.parking.cost}</p>
                  </div>
                  <div>
                    <span className="font-medium">Spaces:</span>
                    <p>{location.parking.spaces} available</p>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="font-medium mb-2">Parking Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    {location.parking.instructions}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Directions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Getting Here
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Car className="h-4 w-4" />
                By Car
              </h4>
              <p className="text-sm text-muted-foreground">
                {location.directions.driving}
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Public Transportation</h4>
              <p className="text-sm text-muted-foreground">
                {location.directions.public_transport}
              </p>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Walking Directions</h4>
              <p className="text-sm text-muted-foreground">
                {location.directions.walking}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Amenities & Accessibility */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Accessibility className="h-5 w-5" />
              Amenities & Accessibility
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Amenities</h4>
              <div className="flex flex-wrap gap-2">
                {location.amenities.map((amenity) => (
                  <Badge
                    key={amenity}
                    variant="secondary"
                    className="flex items-center gap-1"
                  >
                    {getAmenityIcon(amenity)}
                    {amenity}
                  </Badge>
                ))}
              </div>
            </div>

            <Separator />

            <div>
              <h4 className="font-medium mb-2">Accessibility Features</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                {location.accessibility.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {location.notes && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-2">Additional Notes</h4>
                  <p className="text-sm text-muted-foreground">
                    {location.notes}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Mock data example
export const mockLabLocations: LabLocation[] = [
  {
    id: "downtown",
    name: "Downtown Lab Center",
    address: "123 Main Street",
    city: "Downtown",
    state: "CA",
    zipCode: "90210",
    phone: "(555) 123-4567",
    hours: {
      monday: "7:00 AM - 6:00 PM",
      tuesday: "7:00 AM - 6:00 PM",
      wednesday: "7:00 AM - 6:00 PM",
      thursday: "7:00 AM - 6:00 PM",
      friday: "7:00 AM - 5:00 PM",
      saturday: "8:00 AM - 2:00 PM",
      sunday: "Closed",
    },
    parking: {
      available: true,
      type: "Underground Garage",
      cost: "Free for first 2 hours",
      spaces: 150,
      instructions:
        "Enter through Main Street entrance. Take ticket at entry. Validate at lab reception for free parking.",
    },
    amenities: ["WiFi", "Coffee", "Security"],
    accessibility: [
      "Wheelchair accessible entrance",
      "Elevator access to all floors",
      "Accessible restrooms",
      "Reserved parking spaces",
      "Audio assistance available",
    ],
    directions: {
      driving:
        "Take Highway 101 South to Downtown exit. Turn right on Main Street. Building will be on your left after 3 blocks.",
      public_transport:
        "Take Metro Red Line to Downtown/Main Station. Exit at Main Street. Walk 2 blocks north on Main Street.",
      walking:
        "From downtown area, head north on Main Street. The lab is located in the medical building between 1st and 2nd Avenue.",
    },
    notes:
      "Please arrive 15 minutes early for check-in. Bring a valid ID and insurance card.",
  },
  {
    id: "westside",
    name: "Westside Medical Plaza",
    address: "456 West Avenue",
    city: "Westside",
    state: "CA",
    zipCode: "90211",
    phone: "(555) 234-5678",
    hours: {
      monday: "6:30 AM - 5:30 PM",
      tuesday: "6:30 AM - 5:30 PM",
      wednesday: "6:30 AM - 5:30 PM",
      thursday: "6:30 AM - 5:30 PM",
      friday: "6:30 AM - 4:30 PM",
      saturday: "7:00 AM - 1:00 PM",
      sunday: "Closed",
    },
    parking: {
      available: true,
      type: "Surface Lot",
      cost: "Free",
      spaces: 200,
      instructions:
        "Free parking available in the adjacent lot. No validation required.",
    },
    amenities: ["WiFi", "Coffee"],
    accessibility: [
      "Wheelchair accessible",
      "Accessible parking",
      "Wide doorways",
      "Accessible restrooms",
    ],
    directions: {
      driving:
        "Take I-405 to West Avenue exit. Head east on West Avenue for 1 mile. Medical plaza on the right.",
      public_transport:
        "Take Bus Route 720 to West Avenue/Medical Plaza stop. Short walk to building entrance.",
      walking:
        "From Westside shopping center, walk east on West Avenue for approximately 0.5 miles.",
    },
    notes: "Fasting labs available starting at 6:30 AM.",
  },
];
