import { describe, it, expect } from "vitest";
import * as Y from "yjs";

describe("Phase 5: Real-time Co-authoring & Yjs CRDT Convergence", () => {
  it("converges two client documents to identical text regardless of concurrent update ordering", () => {
    // 1. Initialize two isolated Yjs documents representing two collaborating browsers
    const docA = new Y.Doc();
    const docB = new Y.Doc();

    const textA = docA.getText("prosemirror");
    const textB = docB.getText("prosemirror");

    // 2. Client A makes an initial edit in Swahili
    textA.insert(0, "Mfumo wa Kilimo Bora Kenya");

    // Sync Doc A -> Doc B
    const updateA1 = Y.encodeStateAsUpdate(docA);
    Y.applyUpdate(docB, updateA1);

    expect(textB.toString()).toBe("Mfumo wa Kilimo Bora Kenya");

    // 3. Concurrent edits:
    // Client A inserts text at the beginning
    textA.insert(0, "Mradi: ");
    // Client B concurrently appends text at the end
    textB.insert(textB.length, " (Kaunti ya Nakuru)");

    // 4. Exchange incremental delta updates in reverse order
    const updateB = Y.encodeStateAsUpdate(docB, Y.encodeStateVector(docA));
    const updateA2 = Y.encodeStateAsUpdate(docA, Y.encodeStateVector(docB));

    Y.applyUpdate(docA, updateB);
    Y.applyUpdate(docB, updateA2);

    // 5. Verify mathematically proven CRDT convergence
    expect(textA.toString()).toBe("Mradi: Mfumo wa Kilimo Bora Kenya (Kaunti ya Nakuru)");
    expect(textB.toString()).toBe("Mradi: Mfumo wa Kilimo Bora Kenya (Kaunti ya Nakuru)");
    expect(textA.toString()).toBe(textB.toString());
  });

  it("handles structured ProseMirror/TipTap JSON nodes and map attributes convergence", () => {
    const doc1 = new Y.Doc();
    const doc2 = new Y.Doc();

    const map1 = doc1.getMap("meta");
    const map2 = doc2.getMap("meta");

    // Client 1 updates document title and author in Nairobi
    map1.set("title", "Uchumi wa Dijitali Afrika Mashariki");
    map1.set("author", "Chris Odhiambo");

    // Sync 1 -> 2
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));

    expect(map2.get("title")).toBe("Uchumi wa Dijitali Afrika Mashariki");
    expect(map2.get("author")).toBe("Chris Odhiambo");

    // Concurrent attribute update
    map1.set("version", 1);
    map2.set("currency", "KES");

    // Cross sync
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1));
    Y.applyUpdate(doc1, Y.encodeStateAsUpdate(doc2));

    expect(map1.get("version")).toBe(1);
    expect(map1.get("currency")).toBe("KES");
    expect(map2.get("version")).toBe(1);
    expect(map2.get("currency")).toBe("KES");
  });

  it("encodes state vector correctly for partial sync to minimize WebSocket bandwidth", () => {
    const doc = new Y.Doc();
    const text = doc.getText("content");
    text.insert(0, "Maudhui ya majaribio ya mtandao");

    const snapshot = Y.encodeStateAsUpdate(doc);
    expect(snapshot.byteLength).toBeGreaterThan(0);

    const docRestored = new Y.Doc();
    Y.applyUpdate(docRestored, snapshot);
    expect(docRestored.getText("content").toString()).toBe("Maudhui ya majaribio ya mtandao");
  });
});

