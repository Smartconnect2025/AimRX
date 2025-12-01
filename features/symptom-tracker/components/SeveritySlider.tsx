import { Slider } from "@/components/ui/slider";

interface SeveritySliderProps {
  value: number;
  onChange: (value: number[]) => void;
}

const getSeverityColor = (value: number) => {
  if (value <= 3) return "text-green-500";
  if (value <= 7) return "text-orange-400";
  return "text-red-500";
};

const getSeverityLabel = (value: number) => {
  if (value <= 3) return "Mild";
  if (value <= 7) return "Moderate";
  return "Severe";
};

export const SeveritySlider = ({ value, onChange }: SeveritySliderProps) => {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-green-500 font-medium">Mild</span>
        <span className="text-orange-400 font-medium">Moderate</span>
        <span className="text-red-500 font-medium">Severe</span>
      </div>
      <Slider
        value={[value]}
        onValueChange={onChange}
        max={10}
        min={1}
        step={1}
        className="py-4"
        rangeClassName={
          "bg-gradient-to-r from-green-500 via-orange-400 to-red-500"
        }
      />
      <div className="flex justify-between text-sm">
        <span>1</span>
        <span>2</span>
        <span>3</span>
        <span>4</span>
        <span>5</span>
        <span>6</span>
        <span>7</span>
        <span>8</span>
        <span>9</span>
        <span>10</span>
      </div>
      <div className="text-center text-sm font-medium">
        Severity: <span className={getSeverityColor(value)}>{value}</span>{" "}
        <span className={`${getSeverityColor(value)}`}>
          ({getSeverityLabel(value)})
        </span>
      </div>
    </div>
  );
};
