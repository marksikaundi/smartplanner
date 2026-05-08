import { useRouter } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Text, View } from "react-native";
import { AppButton } from "@/components/ui/button";
import { AppInput } from "@/components/ui/input";
import { signUpWithEmail } from "@/services/auth";

type FormData = { username: string; email: string; password: string };

export default function SignUpScreen() {
  const router = useRouter();
  const { control, handleSubmit } = useForm<FormData>();
  const [pending, setPending] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const onSubmit = async (data: FormData) => {
    try {
      setPending(true);
      setErrorText(null);
      await signUpWithEmail(data.email, data.password);
      router.replace("/(onboarding)");
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Failed to create account.");
    } finally {
      setPending(false);
    }
  };

  return (
    <View className="flex-1 gap-4 bg-white px-5 pt-20 dark:bg-black">
      <Text className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">Create account</Text>
      <Controller control={control} name="username" render={({ field: { onChange, value } }) => (
        <AppInput placeholder="Username" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="email" render={({ field: { onChange, value } }) => (
        <AppInput placeholder="Email" value={value} onChangeText={onChange} />
      )} />
      <Controller control={control} name="password" render={({ field: { onChange, value } }) => (
        <AppInput placeholder="Password" secureTextEntry value={value} onChangeText={onChange} />
      )} />
      <AppButton label={pending ? "Creating..." : "Create Account"} onPress={handleSubmit(onSubmit)} disabled={pending} />
      {errorText ? <Text className="text-sm text-red-500">{errorText}</Text> : null}
    </View>
  );
}
