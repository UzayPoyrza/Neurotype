-- Migration Script: Sessions Data (SQL Version)
-- Run this directly in Supabase SQL Editor
-- This bypasses RLS automatically in SQL Editor

-- Clear existing test data (optional - comment out if you want to keep existing)
 DELETE FROM session_modalities WHERE session_id IN ('1','2','3','4','5','7','8','11','12','15','16','19');
 DELETE FROM sessions WHERE id IN ('1','2','3','4','5','7','8','11','12','15','16','19');

-- Insert Sessions
INSERT INTO sessions (id, title, duration_min, technique, description, why_it_works, is_active)
VALUES
  ('1', 'Ocean Waves Meditation', 5, 'sound', 
   'Immerse yourself in the calming sounds of ocean waves. This guided meditation uses nature sounds to help you find peace and reduce anxiety through auditory relaxation.',
   'Ocean sounds have a natural rhythm that mirrors our breathing patterns, helping to regulate the nervous system and activate the relaxation response. The repetitive nature of waves creates a meditative state that reduces cortisol levels.',
   true),
  
  ('2', 'Gentle Stretching Flow', 8, 'movement',
   'A gentle movement practice combining mindful stretching with breath awareness. Perfect for releasing tension and preparing your mind for focused work.',
   'Gentle movement increases blood flow to the brain and releases endorphins. The combination of physical movement and mindful breathing activates both the body and mind, creating an optimal state for concentration.',
   true),
  
  ('3', 'Om Mantra Practice', 10, 'mantra',
   'A traditional mantra meditation using the sacred sound "Om" to calm the mind and prepare for restful sleep.',
   'The vibration of "Om" has been shown to activate the parasympathetic nervous system, promoting relaxation and sleep. Mantra repetition creates a single-pointed focus that quiets mental chatter.',
   true),
  
  ('4', 'Mountain Visualization', 6, 'visualization',
   'Visualize yourself as a strong, stable mountain. This guided imagery helps you feel grounded and resilient in the face of life''s challenges.',
   'Visualization activates the same neural pathways as actual experience, helping you embody qualities of strength and stability. This practice builds confidence and reduces anxious thoughts.',
   true),
  
  ('5', 'Body Scan Journey', 12, 'somatic',
   'A systematic journey through your body, bringing awareness to each part. This practice helps you develop deep body awareness and mental clarity.',
   'Body scanning activates the insula cortex, which is responsible for interoceptive awareness. This practice improves attention regulation and reduces mind-wandering by grounding you in physical sensations.',
   true),
  
  ('7', 'Forest Ambience', 4, 'sound',
   'Short nature sounds from a peaceful forest to help you quickly center and focus. Perfect for a quick mental reset.',
   'Nature sounds have been proven to improve cognitive performance and attention. The gentle background noise helps mask distracting sounds while providing a calming auditory environment.',
   true),
  
  ('8', 'Qi Gong Flow', 15, 'movement',
   'Traditional Chinese energy practice combining gentle movements with breath work to balance your energy and reduce anxiety.',
   'Qi Gong movements are designed to balance the body''s energy systems and activate the relaxation response. The slow, intentional movements help release stored tension and calm the nervous system.',
   true),
  
  ('11', 'Progressive Relaxation', 11, 'somatic',
   'Systematically tense and release each muscle group to achieve deep physical and mental relaxation.',
   'Progressive muscle relaxation directly reduces muscle tension, which is often held during anxiety. This practice teaches your body the difference between tension and relaxation, helping you recognize and release stress.',
   true),
  
  ('12', 'Present Moment Practice', 6, 'mindfulness',
   'A mindfulness practice that brings your attention to the present moment, training your mind to stay focused and aware.',
   'Mindfulness meditation strengthens the anterior cingulate cortex, which is responsible for attention control. Regular practice improves your ability to focus and reduces distractibility.',
   true),
  
  ('15', 'Sleepy Sunset Drift', 12, 'sound',
   'Drift off with gentle narration and soft ambient tones inspired by sunset hues.',
   'Soothing audio cues signal the nervous system to shift into rest-and-digest mode.',
   true),
  
  ('16', 'Morning Grounding Flow', 10, 'movement',
   'A gentle standing flow to shake out stress and welcome grounded energy.',
   'Slow, rhythmic movement paired with breath calms the sympathetic nervous system.',
   true),
  
  ('19', 'Balanced Breath Flow', 11, 'somatic',
   'Alternate nostril breathing paired with body scanning to balance your energy.',
   'Balancing the breath modulates the autonomic nervous system and reduces anxiety.',
   true),
  
  ('6', 'Breath Awareness', 7, 'mindfulness',
   'A simple yet powerful practice of observing your natural breath. Perfect for winding down and preparing for sleep.',
   'Conscious breathing activates the vagus nerve, which controls the parasympathetic nervous system. This directly signals your body to relax and prepare for sleep.',
   true)

ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  duration_min = EXCLUDED.duration_min,
  technique = EXCLUDED.technique,
  description = EXCLUDED.description,
  why_it_works = EXCLUDED.why_it_works,
  is_active = EXCLUDED.is_active;

-- Insert Session-Modality Relationships (Many-to-Many)
-- Some sessions belong to multiple modules

INSERT INTO session_modalities (session_id, modality)
VALUES
  -- Session 1: Ocean Waves - anxiety + stress
  ('1', 'anxiety'),
  ('1', 'stress'),
  
  -- Session 2: Gentle Stretching - focus
  ('2', 'focus'),
  
  -- Session 3: Om Mantra - sleep
  ('3', 'sleep'),
  
  -- Session 4: Mountain Visualization - anxiety
  ('4', 'anxiety'),
  
  -- Session 5: Body Scan - focus + mindfulness
  ('5', 'focus'),
  ('5', 'mindfulness'),
  
  -- Session 6: Breath Awareness - sleep
  ('6', 'sleep'),
  
  -- Session 7: Forest Ambience - focus
  ('7', 'focus'),
  
  -- Session 8: Qi Gong - anxiety + stress
  ('8', 'anxiety'),
  ('8', 'stress'),
  
  -- Session 11: Progressive Relaxation - anxiety + stress
  ('11', 'anxiety'),
  ('11', 'stress'),
  
  -- Session 12: Present Moment - focus + mindfulness
  ('12', 'focus'),
  ('12', 'mindfulness'),
  
  -- Session 15: Sleepy Sunset - sleep + stress
  ('15', 'sleep'),
  ('15', 'stress'),
  
  -- Session 16: Morning Grounding - anxiety
  ('16', 'anxiety'),
  
  -- Session 19: Balanced Breath - anxiety
  ('19', 'anxiety')

ON CONFLICT (session_id, modality) DO NOTHING;

-- Display summary
SELECT 
  s.id,
  s.title,
  s.duration_min,
  s.technique,
  string_agg(sm.modality, ', ' ORDER BY sm.modality) as modules
FROM sessions s
LEFT JOIN session_modalities sm ON s.id = sm.session_id
WHERE s.id IN ('1','2','3','4','5','6','7','8','11','12','15','16','19')
GROUP BY s.id, s.title, s.duration_min, s.technique
ORDER BY s.id;

