import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { LogIn, Loader2 } from "lucide-react";

export function LoginModal() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) setError("Credenciales inválidas.");
        setLoading(false);
    };

    return (
        <div className="p-6 space-y-4 max-w-sm mx-auto bg-card rounded-xl border-2 shadow-sm animate-in zoom-in-95 duration-300 mt-20">
            <div className="text-center space-y-2">
                <div className="bg-primary/10 p-3 rounded-full w-fit mx-auto">
                    <LogIn className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-bold">Admin Login</h2>
                <p className="text-sm text-muted-foreground">Acceso restringido para edición</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label>Correo</Label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                {error && <p className="text-xs text-destructive font-bold">{error}</p>}
                <Button className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Iniciar Sesión"}
                </Button>
            </form>
        </div>
    );
}
