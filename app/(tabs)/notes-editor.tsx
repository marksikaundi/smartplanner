import { databases, ID } from "@/lib/appwrite";
import { APPWRITE_IDS, isConfigured } from "@/lib/appwrite-ids";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function NotesEditorScreen() {
  const router = useRouter();
  const { noteId } = useLocalSearchParams<{ noteId?: string }>();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadNote = async () => {
      if (!noteId || !isConfigured(APPWRITE_IDS.collections.notes)) {
        return;
      }

      try {
        const doc = await databases.getDocument(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.notes,
          String(noteId),
        );
        if (isActive) {
          setTitle(String(doc.title ?? ""));
          setBody(String(doc.body ?? ""));
        }
      } catch {
        if (isActive) {
          Alert.alert("Note not found", "Unable to load this note.");
        }
      }
    };

    loadNote();

    return () => {
      isActive = false;
    };
  }, [noteId]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Missing title", "Add a title before saving.");
      return;
    }

    if (!isConfigured(APPWRITE_IDS.collections.notes)) {
      Alert.alert(
        "Not configured",
        "Set the notes collection ID in lib/appwrite-ids.ts",
      );
      return;
    }

    try {
      setIsSaving(true);
      if (noteId) {
        await databases.updateDocument(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.notes,
          String(noteId),
          {
            title: title.trim(),
            body: body.trim(),
          },
        );
      } else {
        await databases.createDocument(
          APPWRITE_IDS.databaseId,
          APPWRITE_IDS.collections.notes,
          ID.unique(),
          {
            title: title.trim(),
            body: body.trim(),
          },
        );
      }
      router.back();
    } catch (error) {
      const message =
        typeof error === "object" && error && "message" in error
          ? String(error.message)
          : "Unable to save your note.";
      Alert.alert("Save failed", message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{noteId ? "Edit Note" : "New Note"}</Text>
          <Pressable
            style={[styles.saveButton, isSaving ? styles.saveDisabled : null]}
            onPress={handleSave}
            disabled={isSaving}
          >
            <Text style={styles.saveText}>{isSaving ? "Saving" : "Save"}</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Lecture notes"
            placeholderTextColor="#9AA0B4"
            style={styles.input}
          />

          <Text style={styles.label}>Body</Text>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder="Write your notes here..."
            placeholderTextColor="#9AA0B4"
            style={[styles.input, styles.textarea]}
            multiline
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#F4F3F9",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 40,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2D2E3A",
  },
  saveButton: {
    backgroundColor: "#34356E",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  label: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7A7D92",
  },
  input: {
    backgroundColor: "#F7F8FC",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#2D2E3A",
  },
  textarea: {
    minHeight: 140,
    textAlignVertical: "top",
  },
});
