import express from "express";
import cors from "cors";
import { Note } from "./models/note.model.js";

export const app = express();

app.use(cors());

app.use(express.json({ limit: "16kb" }));

app.get("/api/get", async (req, res) => {
  try {
    const { page = 1, limit = 6, query = "" } = req.query;
    const skip = (page - 1) * limit;

    const searchQuery = query.trim()
      ? {
          $or: [
            { title: { $regex: query, $options: "i" } },
            { content: { $regex: query, $options: "i" } },
            { tags: { $elemMatch: { $regex: query, $options: "i" } } },
          ],
        }
      : {};

    const notes = await Note.find(searchQuery)
      .sort({ isPinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    const totalNotes = await Note.countDocuments(searchQuery);

    return res.json({
      notes,
      totalNotes,
      totalPages: Math.ceil(totalNotes / limit),
      currentPage: Number(page),
    });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Notes not fetched" });
  }
});

app.post("/api/add", async (req, res) => {
  const { title, content, tags } = req.body;
  if (!title) {
    return res.status(400).json({ success: false, msg: "Title is required" });
  }
  if (!content) {
    return res.status(400).json({ success: false, msg: "Content is required" });
  }

  try {
    await Note.create({
      title,
      content,
      tags: tags || [],
    });
    return res.json({ success: true, msg: "Note added" });
  } catch (error) {
    return res.status(400).json({
      success: false,
      msg: "Something went wrong while adding note",
    });
  }
});

app.patch("/api/edit/:noteId", async (req, res) => {
  const noteId = req.params.noteId;
  const { title, content, tags, isPinned } = req.body;
  if (!title && !content && !tags) {
    res.status(400).json({ success: false, msg: "No changes made" });
  }
  try {
    await Note.findByIdAndUpdate(noteId, {
      title,
      content,
      tags,
      isPinned,
    });

    return res.json({ success: true, msg: "Note updated" });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Note update error" });
  }
});

app.patch("/api/update-pin/:noteId", async (req, res) => {
  const noteId = req.params.noteId;
  const { isPinned } = req.body;

  try {
    await Note.findByIdAndUpdate(noteId, {
      isPinned,
    });

    return res.json({
      success: true,
      msg: isPinned ? "Pinned note" : "Unpinned note",
    });
  } catch (error) {
    return res.status(400).json({ success: false, msg: "Note pinned error" });
  }
});

app.delete("/api/delete/:noteId", async (req, res) => {
  const noteId = req.params.noteId;
  try {
    const note = await Note.findByIdAndDelete(noteId);
    if (!note) {
      return res.status(404).json({ success: false, msg: "Note not found" });
    }
    return res.json({ success: true, msg: "Note deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, msg: "Server error" });
  }
});
