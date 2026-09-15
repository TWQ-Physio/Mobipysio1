import "@/App.css";
import Landing from "@/pages/Landing";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App" dir="rtl">
      <Landing />
      <Toaster position="top-center" richColors closeButton />
    </div>
  );
}

export default App;
