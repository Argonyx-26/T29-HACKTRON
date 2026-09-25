from app.services.deterministic_engine import DeterministicMisconceptionEngine, ExpressionParser
from app.services.mastery_service import MasteryService, BayesianKnowledgeTracing
from app.services.intervention_service import InterventionService
from app.services.analytics_service import AnalyticsService
from app.services.document_ingestion import DocumentIngestionService
from app.services.llm_reasoning import LLMReasoningService, DualKeyGeminiManager

# Export both classes and instantiated aliases for full compatibility
deterministic_engine = DeterministicMisconceptionEngine()
mastery_service = MasteryService()
intervention_service = InterventionService()
analytics_service = AnalyticsService()
document_ingestion_service = DocumentIngestionService()
llm_reasoning_service = LLMReasoningService()

__all__ = [
    "DeterministicMisconceptionEngine",
    "ExpressionParser",
    "MasteryService",
    "BayesianKnowledgeTracing",
    "InterventionService",
    "AnalyticsService",
    "DocumentIngestionService",
    "LLMReasoningService",
    "DualKeyGeminiManager",
    "deterministic_engine",
    "mastery_service",
    "intervention_service",
    "analytics_service",
    "document_ingestion_service",
    "llm_reasoning_service",
]
