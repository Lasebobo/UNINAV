/**
 * pcm-capture-processor.js
 *
 * Place this in /public so it is served at /pcm-capture-processor.js.
 * AudioWorklet modules must be fetched by URL — they cannot be bundled inline.
 *
 * Runs on the audio rendering thread rather than the main thread, so React
 * re-renders and route computation can't cause dropped microphone frames
 * (the failure mode of the deprecated ScriptProcessorNode).
 *
 * Converts Float32 mic samples to Int16 PCM and posts them to the main thread
 * in ~128ms batches, along with an RMS value for the volume visualiser.
 */

const BATCH_SAMPLES = 2048; // ~128ms at 16kHz

class PCMCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(BATCH_SAMPLES);
    this._offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const channel = input[0];

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._offset++] = channel[i];

      if (this._offset === BATCH_SAMPLES) {
        const pcm = new Int16Array(BATCH_SAMPLES);
        let sumSquares = 0;

        for (let j = 0; j < BATCH_SAMPLES; j++) {
          const s = Math.max(-1, Math.min(1, this._buffer[j]));
          pcm[j] = s < 0 ? s * 0x8000 : s * 0x7fff;
          sumSquares += s * s;
        }

        const rms = Math.sqrt(sumSquares / BATCH_SAMPLES);

        // Transfer the buffer rather than copying it.
        this.port.postMessage({ pcm, rms }, [pcm.buffer]);
        this._offset = 0;
      }
    }

    return true;
  }
}

registerProcessor('pcm-capture-processor', PCMCaptureProcessor);
