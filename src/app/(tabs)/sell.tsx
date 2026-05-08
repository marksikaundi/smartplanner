import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { ScrollView, Text, View } from "react-native";
import { z } from "zod";
import { AppButton } from "@/components/ui/button";
import { AppInput } from "@/components/ui/input";
import { createListing } from "@/services/listings";
import { pickImages, uploadToUploadthing } from "@/services/uploads";

const schema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().min(1),
  location: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

export default function SellScreen() {
  const [pickedUris, setPickedUris] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorText, setErrorText] = useState<string | null>(null);
  const { control, handleSubmit, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { location: "Nairobi Campus" },
  });

  const mutation = useMutation({
    mutationFn: (payload: FormData & { images: string[] }) =>
      createListing({
        ...payload,
        category: "Phones",
        condition: "good",
        negotiable: true,
      }),
  });

  const onPick = async () => {
    const images = await pickImages();
    setPickedUris(images);
    setValue("description", `Photos selected: ${images.length}. Add item details here.`);
  };

  const onSubmit = async (data: FormData) => {
    try {
      setErrorText(null);
      const uploaded: string[] = [];
      for (let i = 0; i < pickedUris.length; i += 1) {
        const url = await uploadToUploadthing(pickedUris[i]);
        uploaded.push(url);
        setUploadProgress(Math.round(((i + 1) / Math.max(pickedUris.length, 1)) * 100));
      }
      mutation.mutate({ ...data, images: uploaded });
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : "Upload failed.");
    }
  };

  return (
    <ScrollView className="flex-1 bg-zinc-50 px-4 pt-14 dark:bg-black">
      <Text className="text-2xl font-bold text-zinc-950 dark:text-zinc-100">Create listing</Text>
      <View className="mt-4 gap-3 pb-14">
        <AppButton label="Pick photos" variant="secondary" onPress={onPick} />
        <Controller control={control} name="title" render={({ field: { value, onChange } }) => <AppInput placeholder="Title" value={value} onChangeText={onChange} />} />
        <Controller control={control} name="description" render={({ field: { value, onChange } }) => <AppInput placeholder="Description" value={value} onChangeText={onChange} multiline />} />
        <Controller control={control} name="price" render={({ field: { value, onChange } }) => <AppInput placeholder="Price" value={String(value ?? "")} onChangeText={onChange} keyboardType="numeric" />} />
        <Controller control={control} name="location" render={({ field: { value, onChange } }) => <AppInput placeholder="Campus/City" value={value} onChangeText={onChange} />} />
        {pickedUris.length > 0 ? <Text className="text-xs text-zinc-500">{pickedUris.length} images selected</Text> : null}
        {uploadProgress > 0 ? <Text className="text-xs text-zinc-500">Upload progress: {uploadProgress}%</Text> : null}
        {errorText ? <Text className="text-sm text-red-500">{errorText}</Text> : null}
        <AppButton label={mutation.isPending ? "Posting..." : "Post listing"} onPress={handleSubmit(onSubmit)} disabled={mutation.isPending} />
      </View>
    </ScrollView>
  );
}
