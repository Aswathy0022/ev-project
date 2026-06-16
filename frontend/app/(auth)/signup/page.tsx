"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Zap, User, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { auth } from "@/lib/api";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const schema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});
type Form = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: Form) => {
    try {
      const res = await auth.signup(data.name, data.email, data.password);
      toast.success(`Account created! Welcome, ${res.user.name}`);
      router.push("/dashboard");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-500/20 shadow-[0_0_24px_rgba(0,212,255,0.3)] mb-4">
            <Zap className="h-6 w-6 text-cyan-400" />
          </div>
          <h1 className="text-2xl font-bold">Create account</h1>
          <p className="text-sm text-muted mt-1">Start tracking your EV rides</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="glass rounded-2xl p-6 space-y-4">
          <Input
            label="Full name"
            type="text"
            placeholder="Ravi Kumar"
            icon={<User className="h-4 w-4" />}
            error={errors.name?.message}
            {...register("name")}
          />
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="h-4 w-4" />}
            error={errors.email?.message}
            {...register("email")}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min. 6 characters"
            icon={<Lock className="h-4 w-4" />}
            error={errors.password?.message}
            {...register("password")}
          />
          <Button type="submit" size="lg" loading={isSubmitting} className="w-full mt-2">
            Create account
          </Button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <p className="text-sm text-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-cyan-400 hover:text-cyan-300 font-medium">
              Sign in
            </Link>
          </p>
          <Link href="/dashboard" className="block text-xs text-muted hover:text-foreground transition-colors">
            Continue as guest →
          </Link>
        </div>
      </div>
    </div>
  );
}
