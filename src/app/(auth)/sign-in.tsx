import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/ui/button";
import { AppInput } from "@/components/ui/input";
import { signInWithEmail, signInWithGoogle } from "@/services/auth";
import { useAuthStore } from "@/state/auth-store";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormData = z.infer<typeof schema>;

export default function SignInScreen() {
  const router = useRouter();
  const { continueAsGuest } = useAuthStore();
  const [pending, setPending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { control, handleSubmit } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      setPending(true);
      setErrorText(null);
      await signInWithEmail(data.email, data.password);
      router.replace("/(onboarding)");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Failed to sign in.");
    } finally {
      setPending(false);
    }
  };

  return (
    <View className="flex-1 gap-4 bg-white px-5 pt-20 dark:bg-black">
      <Text className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">Campus Market</Text>
      <Text className="text-zinc-500">Buy and sell around your campus safely.</Text>
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <AppInput placeholder="Email" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <AppInput placeholder="Password" secureTextEntry value={value} onChangeText={onChange} />
      )} />
      <AppButton label={pending ? "Signing in..." : "Sign In"} onPress={handleSubmit(onSubmit)} disabled={pending} />
      <AppButton label="Continue with Google" variant="secondary" onPress={async () => {
        try {
          setPending(true);
          setErrorText(null);
          await signInWithGoogle();
          router.replace("/(onboarding)");
        } catch (error) {
          setErrorText(error instanceof Error ? error.message : "Google sign-in failed.");
        } finally {
          setPending(false);
        }
      }} />
      <AppButton label="Continue as Guest" variant="secondary" onPress={() => { continueAsGuest(); router.replace("/(onboarding)"); }} />
      {errorText ? <Text className="text-sm text-red-500">{errorText}</Text> : null}
      <Link href="/(auth)/sign-up" className="text-center text-zinc-500">
        No account? Create one
      </Link>
    </View>
  );
}
