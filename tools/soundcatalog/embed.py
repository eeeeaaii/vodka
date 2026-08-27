"""Embed samples with CLAP and cache the vectors.

The audio embeddings are the expensive part and depend only on the samples, so
they are cached. Re-scoring against an edited vocabulary then costs a matrix
multiply, which is what makes the word list cheap to iterate on.
"""
import sys, os, glob, json, numpy as np

def main(patterns, out):
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from prepare import to_window, TARGET_SR
    import torch, laion_clap

    files = []
    for p in patterns:
        files.extend(sorted(glob.glob(p)))
    print(f'{len(files)} files; loading CLAP...')
    model = laion_clap.CLAP_Module(enable_fusion=False)
    model.load_ckpt()

    # 10s at 48kHz is ~2MB per file as float32, so batch rather than stacking all
    BATCH = 32
    chunks, kinds = [], []
    for start in range(0, len(files), BATCH):
        batch = files[start:start + BATCH]
        audio = []
        for f in batch:
            d, kind = to_window(f)
            audio.append(d.astype(np.float32)); kinds.append(kind)
        with torch.no_grad():
            chunks.append(np.asarray(model.get_audio_embedding_from_data(
                x=np.stack(audio), use_tensor=False)))
        print(f'  embedded {min(start+BATCH, len(files))}/{len(files)}', flush=True)
    emb = np.concatenate(chunks, axis=0)
    emb = emb / (np.linalg.norm(emb, axis=1, keepdims=True) + 1e-12)
    np.savez(out, embeddings=emb, files=np.array(files), kinds=np.array(kinds))
    print(f'wrote {out}  shape={emb.shape}')

if __name__ == '__main__':
    main(sys.argv[1:-1], sys.argv[-1])
