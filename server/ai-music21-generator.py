
#!/usr/bin/env python3
"""
AI-Powered Music Generator integrating Music21 with Machine Learning
Supports LSTM neural networks and pattern-based generation
"""

import sys
import json
import os
import numpy as np
from pathlib import Path
import pickle
import random
from music21 import stream, note, chord, meter, tempo, key, duration, pitch, scale, interval
from music21 import converter, corpus, analysis, features
from music21.midi import MidiFile

# Optional ML dependencies (graceful fallback if not available)
try:
    import tensorflow as tf
    from tensorflow.keras.models import Sequential, load_model
    from tensorflow.keras.layers import LSTM, Dense, Dropout, Embedding
    from tensorflow.keras.utils import to_categorical
    from sklearn.preprocessing import LabelEncoder
    ML_AVAILABLE = True
except ImportError:
    ML_AVAILABLE = False
    print("⚠️  ML libraries not available. Using rule-based generation.")

class AIMusic21Generator:
    def __init__(self, model_path=None):
        self.model_path = model_path
        self.model = None
        self.note_encoder = None
        self.sequence_length = 100
        self.training_data = []
        self.note_to_int = {}
        self.int_to_note = {}
        
        # Load pre-trained model if available
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
    
    def extract_notes_from_midi(self, midi_path):
        """Extract notes from MIDI file for training data"""
        try:
            score = converter.parse(midi_path)
            notes = []
            
            # Extract notes and chords
            for element in score.flat.notesAndRests:
                if isinstance(element, note.Note):
                    notes.append(str(element.pitch))
                elif isinstance(element, chord.Chord):
                    notes.append('.'.join(str(n) for n in element.normalOrder))
                elif isinstance(element, note.Rest):
                    notes.append('REST')
            
            return notes
        except Exception as e:
            print(f"⚠️  Error extracting notes from {midi_path}: {e}")
            return []
    
    def prepare_training_sequences(self, notes):
        """Prepare sequences for LSTM training"""
        if not notes:
            return [], []
        
        # Create note mappings
        unique_notes = sorted(list(set(notes)))
        self.note_to_int = {note: i for i, note in enumerate(unique_notes)}
        self.int_to_note = {i: note for i, note in enumerate(unique_notes)}
        
        # Create input sequences
        network_input = []
        network_output = []
        
        for i in range(len(notes) - self.sequence_length):
            sequence_in = notes[i:i + self.sequence_length]
            sequence_out = notes[i + self.sequence_length]
            
            network_input.append([self.note_to_int[note] for note in sequence_in])
            network_output.append(self.note_to_int[sequence_out])
        
        n_patterns = len(network_input)
        n_vocab = len(unique_notes)
        
        # Reshape input for LSTM
        network_input = np.reshape(network_input, (n_patterns, self.sequence_length, 1))
        network_input = network_input / float(n_vocab)
        network_output = to_categorical(network_output)
        
        return network_input, network_output
    
    def create_lstm_model(self, n_vocab):
        """Create LSTM neural network model"""
        if not ML_AVAILABLE:
            return None
        
        model = Sequential([
            LSTM(512, input_shape=(self.sequence_length, 1), return_sequences=True),
            Dropout(0.3),
            LSTM(512, return_sequences=True),
            Dropout(0.3),
            LSTM(512),
            Dense(256),
            Dropout(0.3),
            Dense(n_vocab, activation='softmax')
        ])
        
        model.compile(loss='categorical_crossentropy', optimizer='adam')
        return model
    
    def train_model(self, training_data_path, epochs=50):
        """Train LSTM model on music data"""
        if not ML_AVAILABLE:
            print("❌ ML libraries not available for training")
            return False
        
        print("🤖 Starting AI model training...")
        
        # Collect training data
        all_notes = []
        training_files = []
        
        # Support multiple file types
        data_path = Path(training_data_path)
        if data_path.is_file():
            training_files = [data_path]
        elif data_path.is_dir():
            training_files = list(data_path.glob('*.mid')) + list(data_path.glob('*.midi'))
        
        # Use music21 corpus if no training data provided
        if not training_files:
            print("📚 Using music21 corpus for training...")
            bach_pieces = corpus.search('bach')[:10]  # Limit for demo
            for piece in bach_pieces:
                try:
                    score = corpus.parse(piece)
                    notes = self.extract_notes_from_score(score)
                    all_notes.extend(notes)
                except:
                    continue
        else:
            # Extract notes from provided files
            for file_path in training_files[:20]:  # Limit files for demo
                notes = self.extract_notes_from_midi(str(file_path))
                all_notes.extend(notes)
        
        if not all_notes:
            print("❌ No training data found")
            return False
        
        print(f"📊 Extracted {len(all_notes)} notes from training data")
        
        # Prepare training sequences
        network_input, network_output = self.prepare_training_sequences(all_notes)
        
        if len(network_input) == 0:
            print("❌ No training sequences generated")
            return False
        
        # Create and train model
        n_vocab = len(set(all_notes))
        self.model = self.create_lstm_model(n_vocab)
        
        print(f"🧠 Training LSTM model with {len(network_input)} sequences...")
        self.model.fit(network_input, network_output, epochs=epochs, batch_size=64, verbose=1)
        
        # Save model and encodings
        model_dir = Path("models")
        model_dir.mkdir(exist_ok=True)
        
        self.model.save(str(model_dir / "lstm_music_model.h5"))
        
        # Save note mappings
        with open(model_dir / "note_mappings.pkl", 'wb') as f:
            pickle.dump({
                'note_to_int': self.note_to_int,
                'int_to_note': self.int_to_note
            }, f)
        
        print("✅ Model training completed and saved")
        return True
    
    def extract_notes_from_score(self, score):
        """Extract notes from a music21 score object"""
        notes = []
        for element in score.flat.notesAndRests:
            if isinstance(element, note.Note):
                notes.append(str(element.pitch))
            elif isinstance(element, chord.Chord):
                notes.append('.'.join(str(n) for n in element.normalOrder))
            elif isinstance(element, note.Rest):
                notes.append('REST')
        return notes
    
    def load_model(self, model_path):
        """Load pre-trained model"""
        if not ML_AVAILABLE:
            return False
        
        try:
            self.model = load_model(model_path)
            
            # Load note mappings
            mappings_path = Path(model_path).parent / "note_mappings.pkl"
            if mappings_path.exists():
                with open(mappings_path, 'rb') as f:
                    mappings = pickle.load(f)
                    self.note_to_int = mappings['note_to_int']
                    self.int_to_note = mappings['int_to_note']
            
            print("✅ AI model loaded successfully")
            return True
        except Exception as e:
            print(f"❌ Error loading model: {e}")
            return False
    
    def generate_ai_melody(self, seed_sequence=None, length=100, temperature=1.0):
        """Generate melody using trained LSTM model"""
        if not self.model or not ML_AVAILABLE:
            return self.generate_rule_based_melody(length)
        
        # Prepare seed sequence
        if seed_sequence is None:
            # Use random seed from training data
            if self.int_to_note:
                seed_sequence = [random.choice(list(self.int_to_note.values())) 
                               for _ in range(self.sequence_length)]
            else:
                return self.generate_rule_based_melody(length)
        
        # Generate sequence
        pattern = [self.note_to_int.get(note, 0) for note in seed_sequence[-self.sequence_length:]]
        prediction_output = []
        n_vocab = len(self.int_to_note)
        
        for _ in range(length):
            prediction_input = np.reshape(pattern, (1, len(pattern), 1))
            prediction_input = prediction_input / float(n_vocab)
            
            prediction = self.model.predict(prediction_input, verbose=0)
            
            # Apply temperature for creativity control
            prediction = np.log(prediction + 1e-8) / temperature
            exp_preds = np.exp(prediction)
            prediction = exp_preds / np.sum(exp_preds)
            
            index = np.random.choice(len(prediction[0]), p=prediction[0])
            result = self.int_to_note[index]
            prediction_output.append(result)
            
            pattern.append(index)
            pattern = pattern[1:]
        
        return self.convert_to_music21_notes(prediction_output)
    
    def generate_rule_based_melody(self, length=100):
        """Fallback rule-based melody generation"""
        notes = []
        scale_notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5']
        
        for i in range(length):
            if random.random() < 0.1:  # 10% chance of rest
                notes.append('REST')
            else:
                note_choice = random.choice(scale_notes)
                notes.append(note_choice)
        
        return self.convert_to_music21_notes(notes)
    
    def convert_to_music21_notes(self, note_sequence):
        """Convert note sequence to music21 Note objects"""
        music21_notes = []
        
        for note_str in note_sequence:
            if note_str == 'REST':
                rest = note.Rest(quarterLength=0.5)
                music21_notes.append(rest)
            elif '.' in note_str:  # Chord
                chord_notes = note_str.split('.')
                try:
                    chord_pitches = [pitch.Pitch(int(n) + 60) for n in chord_notes if n.isdigit()]
                    if chord_pitches:
                        chord_obj = chord.Chord(chord_pitches, quarterLength=1.0)
                        music21_notes.append(chord_obj)
                except:
                    # Fallback to single note
                    note_obj = note.Note('C4', quarterLength=1.0)
                    music21_notes.append(note_obj)
            else:
                try:
                    note_obj = note.Note(note_str, quarterLength=0.5)
                    music21_notes.append(note_obj)
                except:
                    # Fallback for invalid notes
                    note_obj = note.Note('C4', quarterLength=0.5)
                    music21_notes.append(note_obj)
        
        return music21_notes
    
    def generate_ai_enhanced_composition(self, title, lyrics, genre, tempo_bpm, key_sig, duration_seconds):
        """Generate complete composition using AI enhancement"""
        print(f"🤖 Generating AI-enhanced composition: {title}")
        
        # Create base score
        score = stream.Score()
        score.metadata = {}
        score.metadata.title = title
        score.metadata.composer = 'AI Music21 Generator'
        
        # Musical setup
        score.append(meter.TimeSignature('4/4'))
        score.append(tempo.TempoIndication(number=tempo_bpm))
        score.append(key.KeySignature(key_sig))
        
        # Calculate length
        measures = max(8, int((duration_seconds * tempo_bpm / 60) / 4))
        melody_length = measures * 4  # 4 notes per measure average
        
        # Generate AI melody
        ai_melody = self.generate_ai_melody(length=melody_length, temperature=0.8)
        
        # Create melody part
        melody_part = stream.Part()
        melody_part.partName = 'AI Generated Melody'
        for note_obj in ai_melody:
            melody_part.append(note_obj)
        
        # Generate AI-assisted harmony
        harmony_part = self.generate_ai_harmony(key_sig, measures)
        
        # Add parts to score
        score.append(melody_part)
        score.append(harmony_part)
        
        return score
    
    def generate_ai_harmony(self, key_sig, measures):
        """Generate harmony using AI-assisted chord progressions"""
        harmony = stream.Part()
        harmony.partName = 'AI Generated Harmony'
        
        # AI-enhanced chord progressions based on common patterns
        progressions = {
            'major': [['I', 'V', 'vi', 'IV'], ['vi', 'IV', 'I', 'V'], ['I', 'vi', 'IV', 'V']],
            'minor': [['i', 'VII', 'VI', 'VII'], ['i', 'iv', 'VII', 'III'], ['i', 'VI', 'VII', 'i']]
        }
        
        # Determine if key is major or minor
        key_obj = key.Key(key_sig)
        is_major = key_obj.mode == 'major'
        chord_set = progressions['major'] if is_major else progressions['minor']
        
        # Generate chords using AI-influenced selection
        for measure in range(measures):
            progression = random.choice(chord_set)
            chord_symbol = progression[measure % len(progression)]
            
            # Create chord with AI enhancement
            chord_obj = self.create_enhanced_chord(chord_symbol, key_obj, measure)
            chord_obj.quarterLength = 4.0
            harmony.append(chord_obj)
        
        return harmony
    
    def create_enhanced_chord(self, chord_symbol, key_obj, position):
        """Create enhanced chord with AI-influenced voicing"""
        try:
            from music21 import roman
            roman_chord = roman.Roman(chord_symbol, key_obj)
            chord_tones = list(roman_chord.pitches)
            
            # AI enhancement: add color tones based on position
            if position % 4 == 0:  # Strong beats get extensions
                if random.random() > 0.6:
                    # Add 7th
                    seventh = chord_tones[0].transpose('m7')
                    chord_tones.append(seventh)
            
            chord_obj = chord.Chord(chord_tones, quarterLength=4.0)
            return chord_obj
        except:
            # Fallback chord
            root = key_obj.tonic
            triad = chord.Chord([root, root.transpose('M3'), root.transpose('P5')], quarterLength=4.0)
            return triad

def main():
    if len(sys.argv) < 8:
        print("Usage: python ai-music21-generator.py <title> <lyrics> <genre> <tempo> <key> <duration> <output_path> [--train=<data_path>] [--model=<model_path>]")
        sys.exit(1)
    
    # Parse arguments
    title = sys.argv[1].strip('"')
    lyrics = sys.argv[2].strip('"')
    genre = sys.argv[3].strip('"')
    tempo_bpm = int(sys.argv[4])
    key_sig = sys.argv[5].strip('"')
    duration_seconds = int(sys.argv[6])
    output_path = sys.argv[7].strip('"')
    
    # Parse optional arguments
    train_data_path = None
    model_path = None
    
    for arg in sys.argv[8:]:
        if arg.startswith("--train="):
            train_data_path = arg.split("=", 1)[1]
        elif arg.startswith("--model="):
            model_path = arg.split("=", 1)[1]
    
    try:
        # Initialize AI generator
        ai_generator = AIMusic21Generator(model_path)
        
        # Train model if training data provided
        if train_data_path:
            print("🎓 Training AI model...")
            ai_generator.train_model(train_data_path, epochs=20)
        
        # Generate composition
        score = ai_generator.generate_ai_enhanced_composition(
            title, lyrics, genre, tempo_bpm, key_sig, duration_seconds
        )
        
        # Write output
        score.write('midi', fp=output_path)
        print(f"✅ AI-enhanced composition saved: {output_path}")
        
        # Generate metadata
        metadata = {
            "title": title,
            "genre": genre,
            "tempo": tempo_bpm,
            "key": key_sig,
            "duration": duration_seconds,
            "ai_features": {
                "lstm_model": ML_AVAILABLE and ai_generator.model is not None,
                "training_data_used": train_data_path is not None,
                "enhanced_harmony": True,
                "machine_learning": ML_AVAILABLE
            },
            "generation_method": "ai_music21_hybrid"
        }
        
        metadata_path = output_path.replace('.mid', '_ai_metadata.json')
        with open(metadata_path, 'w') as f:
            json.dump(metadata, f, indent=2)
        
        print("🤖 AI-enhanced music generation completed!")
        
    except Exception as e:
        print(f"❌ Error in AI music generation: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
