import Calculator from "@/components/Calculator";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8">
      <div className="text-center space-y-8">
        <div>
          <h1 className="mb-2 text-4xl font-bold text-foreground">Calculator</h1>
          <p className="text-muted-foreground">Simple & elegant calculations</p>
        </div>
        <Calculator />
      </div>
    </div>
  );
};

export default Index;
