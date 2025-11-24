import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const Calculator = () => {
  const [display, setDisplay] = useState("0");
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputDigit = (digit: string) => {
    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === "0" ? digit : display + digit);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay("0.");
      setWaitingForOperand(false);
    } else if (display.indexOf(".") === -1) {
      setDisplay(display + ".");
    }
  };

  const clear = () => {
    setDisplay("0");
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      let newValue = currentValue;

      switch (operation) {
        case "+":
          newValue = currentValue + inputValue;
          break;
        case "-":
          newValue = currentValue - inputValue;
          break;
        case "×":
          newValue = currentValue * inputValue;
          break;
        case "÷":
          newValue = currentValue / inputValue;
          break;
        default:
          break;
      }

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      let newValue = previousValue;

      switch (operation) {
        case "+":
          newValue = previousValue + inputValue;
          break;
        case "-":
          newValue = previousValue - inputValue;
          break;
        case "×":
          newValue = previousValue * inputValue;
          break;
        case "÷":
          newValue = previousValue / inputValue;
          break;
        default:
          break;
      }

      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const buttonClass = "h-16 text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95";

  return (
    <div className="w-full max-w-sm mx-auto p-6 rounded-2xl bg-calc-body shadow-2xl">
      {/* Display */}
      <div className="mb-6 p-6 rounded-xl bg-calc-display text-calc-display-foreground">
        <div className="text-right text-5xl font-light tracking-tight break-all min-h-[3.5rem] flex items-center justify-end">
          {display}
        </div>
      </div>

      {/* Buttons Grid */}
      <div className="grid grid-cols-4 gap-3">
        {/* First Row */}
        <Button
          onClick={clear}
          className={cn(buttonClass, "col-span-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground")}
        >
          C
        </Button>
        <Button
          onClick={() => performOperation("÷")}
          className={cn(buttonClass, "bg-calc-operation hover:bg-calc-operation-hover text-primary-foreground")}
        >
          ÷
        </Button>
        <Button
          onClick={() => performOperation("×")}
          className={cn(buttonClass, "bg-calc-operation hover:bg-calc-operation-hover text-primary-foreground")}
        >
          ×
        </Button>

        {/* Numbers 7-9 and - */}
        {[7, 8, 9].map((num) => (
          <Button
            key={num}
            onClick={() => inputDigit(String(num))}
            className={cn(buttonClass, "bg-calc-button hover:bg-calc-button-hover text-foreground")}
          >
            {num}
          </Button>
        ))}
        <Button
          onClick={() => performOperation("-")}
          className={cn(buttonClass, "bg-calc-operation hover:bg-calc-operation-hover text-primary-foreground")}
        >
          -
        </Button>

        {/* Numbers 4-6 and + */}
        {[4, 5, 6].map((num) => (
          <Button
            key={num}
            onClick={() => inputDigit(String(num))}
            className={cn(buttonClass, "bg-calc-button hover:bg-calc-button-hover text-foreground")}
          >
            {num}
          </Button>
        ))}
        <Button
          onClick={() => performOperation("+")}
          className={cn(buttonClass, "bg-calc-operation hover:bg-calc-operation-hover text-primary-foreground")}
        >
          +
        </Button>

        {/* Numbers 1-3 and = */}
        {[1, 2, 3].map((num) => (
          <Button
            key={num}
            onClick={() => inputDigit(String(num))}
            className={cn(buttonClass, "bg-calc-button hover:bg-calc-button-hover text-foreground")}
          >
            {num}
          </Button>
        ))}
        <Button
          onClick={handleEquals}
          className={cn(buttonClass, "row-span-2 bg-calc-equals hover:bg-calc-equals-hover text-primary-foreground")}
        >
          =
        </Button>

        {/* Zero and decimal */}
        <Button
          onClick={() => inputDigit("0")}
          className={cn(buttonClass, "col-span-2 bg-calc-button hover:bg-calc-button-hover text-foreground")}
        >
          0
        </Button>
        <Button
          onClick={inputDecimal}
          className={cn(buttonClass, "bg-calc-button hover:bg-calc-button-hover text-foreground")}
        >
          .
        </Button>
      </div>
    </div>
  );
};

export default Calculator;
