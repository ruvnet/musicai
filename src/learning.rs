/*!
 * Learning and pattern recognition
 */

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Pattern {
    pub id: String,
    pub embedding: Vec<f64>,
    pub metadata: HashMap<String, String>,
    pub feedback: f64,
    pub timestamp: u64,
}

pub struct LearningEngine {
    patterns: Vec<Pattern>,
    max_patterns: usize,
}

impl LearningEngine {
    pub fn new(max_patterns: usize) -> Self {
        Self {
            patterns: Vec::new(),
            max_patterns,
        }
    }

    /// Store a new pattern
    pub fn store_pattern(&mut self, pattern: Pattern) {
        if self.patterns.len() >= self.max_patterns {
            // Remove oldest pattern
            self.patterns.remove(0);
        }
        self.patterns.push(pattern);
    }

    /// Find similar patterns using cosine similarity
    pub fn find_similar(&self, query: &[f64], top_k: usize) -> Vec<(usize, f64)> {
        let mut similarities: Vec<(usize, f64)> = self
            .patterns
            .iter()
            .enumerate()
            .map(|(idx, pattern)| {
                let similarity = self.cosine_similarity(query, &pattern.embedding);
                (idx, similarity)
            })
            .collect();

        similarities.sort_by(|a, b| b.1.partial_cmp(&a.1).unwrap());
        similarities.truncate(top_k);
        similarities
    }

    /// Calculate cosine similarity
    fn cosine_similarity(&self, a: &[f64], b: &[f64]) -> f64 {
        if a.len() != b.len() {
            return 0.0;
        }

        let dot_product: f64 = a.iter().zip(b.iter()).map(|(x, y)| x * y).sum();
        let norm_a: f64 = a.iter().map(|x| x * x).sum::<f64>().sqrt();
        let norm_b: f64 = b.iter().map(|x| x * x).sum::<f64>().sqrt();

        if norm_a < 1e-10 || norm_b < 1e-10 {
            return 0.0;
        }

        dot_product / (norm_a * norm_b)
    }

    /// Get learning statistics
    pub fn get_stats(&self) -> HashMap<String, f64> {
        let mut stats = HashMap::new();

        stats.insert("total_patterns".to_string(), self.patterns.len() as f64);

        if !self.patterns.is_empty() {
            let avg_feedback: f64 = self.patterns.iter()
                .map(|p| p.feedback)
                .sum::<f64>() / self.patterns.len() as f64;

            stats.insert("avg_feedback".to_string(), avg_feedback);
        }

        stats
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_learning_engine_creation() {
        let engine = LearningEngine::new(1000);
        assert_eq!(engine.patterns.len(), 0);
    }

    #[test]
    fn test_store_pattern() {
        let mut engine = LearningEngine::new(1000);

        let pattern = Pattern {
            id: "test1".to_string(),
            embedding: vec![0.1, 0.2, 0.3],
            metadata: HashMap::new(),
            feedback: 0.9,
            timestamp: 123456,
        };

        engine.store_pattern(pattern);
        assert_eq!(engine.patterns.len(), 1);
    }

    #[test]
    fn test_cosine_similarity() {
        let engine = LearningEngine::new(1000);

        let a = vec![1.0, 0.0, 0.0];
        let b = vec![1.0, 0.0, 0.0];

        let similarity = engine.cosine_similarity(&a, &b);
        assert!((similarity - 1.0).abs() < 1e-6);
    }
}
