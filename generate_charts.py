import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.font_manager as fm
import numpy as np

# Setup fonts - use wqy-zenhei which is a .ttc file
fm.fontManager.addfont('/usr/share/fonts/truetype/chinese/SarasaMonoSC-Regular.ttf')
fm.fontManager.addfont('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf')
plt.rcParams['font.sans-serif'] = ['Sarasa Mono SC', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# Color palette - tech/wellness themed
ACCENT = "#4A90D9"
SERIES = ["#4A90D9", "#7BC67E", "#F5A623", "#D0021B", "#9B59B6", "#1ABC9C"]
BG = "white"
TEXT = "#2C3E50"
GRID = "#E0E0E0"

# ====== Chart 1: Feature Radar Chart ======
def radar_chart():
    categories = ["Real-Time\nTracking", "Multi-Agent\nWorkflow", "Crisis\nDetection", 
                  "Multi-Source\nInput", "Long-Term\nMemory", "Personalized\nIntervention"]
    our_product = [9, 9, 8, 9, 8, 9]
    typical_competitor = [5, 3, 4, 3, 2, 5]
    
    n = len(categories)
    angles = np.linspace(0, 2 * np.pi, n, endpoint=False).tolist()
    angles += angles[:1]
    
    our_vals = our_product + our_product[:1]
    comp_vals = typical_competitor + typical_competitor[:1]
    
    fig, ax = plt.subplots(figsize=(9, 9), subplot_kw=dict(polar=True))
    
    ax.plot(angles, our_vals, linewidth=2.5, label="MindGuard (Proposed)", color=ACCENT, marker='o', markersize=7)
    ax.fill(angles, our_vals, alpha=0.15, color=ACCENT)
    
    ax.plot(angles, comp_vals, linewidth=2.5, label="Typical Competitor", color="#D0021B", linestyle='--', marker='s', markersize=6)
    ax.fill(angles, comp_vals, alpha=0.08, color="#D0021B")
    
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels(categories, fontsize=11, color=TEXT)
    ax.set_ylim(0, 10)
    ax.set_yticks([2, 4, 6, 8, 10])
    ax.set_yticklabels(["2", "4", "6", "8", "10"], fontsize=9, color="gray")
    ax.legend(loc="upper right", bbox_to_anchor=(1.25, 1.15), fontsize=12, frameon=True, fancybox=True, shadow=True)
    ax.set_title("Feature Comparison: MindGuard vs Typical Solutions", fontsize=15, pad=30, color=TEXT, fontweight='bold')
    
    fig.savefig("/home/z/my-project/download/radar_comparison.png", dpi=200, bbox_inches="tight", pad_inches=0.3, facecolor="white", edgecolor="none")
    plt.close(fig)
    print("Radar chart saved.")

# ====== Chart 2: Implementation Timeline (Gantt-like horizontal bar) ======
def timeline_chart():
    phases = [
        "Phase 1: Core Pipeline",
        "Phase 2: Multi-Agent System", 
        "Phase 3: Real-Time Dashboard",
        "Phase 4: Wearable Integration",
        "Phase 5: Polish & Demo"
    ]
    starts = [0, 2, 4, 6, 8]
    durations = [3, 3, 3, 2, 2]
    colors = [SERIES[0], SERIES[1], SERIES[2], SERIES[4], SERIES[5]]
    
    fig, ax = plt.subplots(figsize=(12, 5))
    
    for i, (phase, start, dur, color) in enumerate(zip(phases, starts, durations, colors)):
        ax.barh(i, dur, left=start, height=0.6, color=color, edgecolor="white", linewidth=1.5, alpha=0.85)
        ax.text(start + dur/2, i, f"Week {start+1}-{start+dur}", ha="center", va="center", fontsize=10, color="white", fontweight='bold')
    
    ax.set_yticks(range(len(phases)))
    ax.set_yticklabels(phases, fontsize=11, color=TEXT)
    ax.set_xlabel("Weeks", fontsize=12, color=TEXT)
    ax.set_title("Implementation Roadmap", fontsize=15, pad=15, color=TEXT, fontweight='bold')
    ax.set_xlim(-0.5, 11)
    ax.invert_yaxis()
    ax.spines[["top", "right"]].set_visible(False)
    ax.grid(axis="x", alpha=0.3, color=GRID)
    
    # Add milestone markers
    milestones = [(3, "MVP"), (5, "Alpha"), (7, "Beta"), (9, "RC"), (10, "Demo")]
    for week, label in milestones:
        ax.axvline(x=week, color="#D0021B", linestyle=":", alpha=0.5, linewidth=1)
        ax.text(week, len(phases)-0.3, label, ha="center", fontsize=9, color="#D0021B", fontweight='bold')
    
    fig.savefig("/home/z/my-project/download/timeline.png", dpi=200, bbox_inches="tight", pad_inches=0.1, facecolor="white", edgecolor="none")
    plt.close(fig)
    print("Timeline chart saved.")

# ====== Chart 3: Architecture Flow Diagram ======
def architecture_diagram():
    fig, ax = plt.subplots(figsize=(14, 10))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 10)
    ax.axis("off")
    
    def draw_box(x, y, w, h, text, color, text_color="white", fontsize=10, alpha=0.9):
        from matplotlib.patches import FancyBboxPatch
        rect = FancyBboxPatch((x, y), w, h, boxstyle="round,pad=0.05", facecolor=color, edgecolor="white", linewidth=2, alpha=alpha, zorder=2)
        ax.add_patch(rect)
        ax.text(x + w/2, y + h/2, text, ha="center", va="center", fontsize=fontsize, color=text_color, fontweight='bold', zorder=3)
    
    def draw_arrow(x1, y1, x2, y2, color="#888888"):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=color, lw=1.5), zorder=1)
    
    # Title
    ax.text(7, 9.7, "Multi-Agent Architecture Overview", ha="center", va="center", fontsize=18, color=TEXT, fontweight='bold')
    
    # Input Sources (left column)
    ax.text(1.5, 9.1, "INPUT SOURCES", ha="center", fontsize=12, color=TEXT, fontweight='bold')
    inputs = [
        ("Voice Journal\n(Whisper STT)", "#4A90D9"),
        ("Text Diary\n(NLP Input)", "#5DADE2"),
        ("Study Behavior\n(Activity Logs)", "#7BC67E"),
        ("Chat\n(Conversational)", "#F5A623"),
        ("Wearable Data\n(HR / Sleep)", "#9B59B6"),
    ]
    for i, (label, color) in enumerate(inputs):
        draw_box(0.2, 7.8 - i*1.3, 2.6, 1.0, label, color, fontsize=9)
    
    # Arrows from inputs to agents
    for i in range(5):
        draw_arrow(2.8, 8.3 - i*1.3, 4.0, 8.3 - i*0.8, "#AAAAAA")
    
    # Processing Agents (middle column)
    ax.text(5.8, 9.1, "SPECIALIZED AGENTS", ha="center", fontsize=12, color=TEXT, fontweight='bold')
    agents = [
        ("Sentiment\nAgent", "#E74C3C"),
        ("Behavior\nAgent", "#E67E22"),
        ("Physio\nAgent", "#2ECC71"),
        ("Crisis\nDetector", "#C0392B"),
        ("Memory\nAgent", "#8E44AD"),
    ]
    for i, (label, color) in enumerate(agents):
        draw_box(4.0, 7.8 - i*1.3, 2.6, 1.0, label, color, fontsize=9)
    
    # Central Orchestrator
    draw_box(7.2, 5.2, 3.0, 2.5, "LangGraph\nSupervisor\nOrchestrator", "#1A5276", fontsize=12, alpha=0.95)
    
    # Arrows from agents to orchestrator
    for i in range(5):
        draw_arrow(6.6, 8.3 - i*1.3, 7.2, 6.5, "#555555")
    
    # Output Agents (right column)
    ax.text(11.5, 9.1, "OUTPUT AGENTS", ha="center", fontsize=12, color=TEXT, fontweight='bold')
    outputs = [
        ("Coping\nStrategies", "#27AE60"),
        ("Mindfulness\nExercises", "#16A085"),
        ("Motivational\nNudges", "#2980B9"),
        ("Weekly\nInsights", "#8E44AD"),
        ("Crisis\nEscalation", "#C0392B"),
    ]
    for i, (label, color) in enumerate(outputs):
        draw_box(10.5, 7.8 - i*1.3, 2.6, 1.0, label, color, fontsize=9)
    
    # Arrows from orchestrator to outputs
    for i in range(5):
        draw_arrow(10.2, 6.5, 10.5, 8.3 - i*1.3, "#555555")
    
    # Memory store (bottom)
    draw_box(4.5, 0.3, 5.0, 1.2, "ChromaDB / Vector Store\n(Long-Term Context & Session Memory)", "#34495E", fontsize=10)
    draw_arrow(7.0, 5.2, 7.0, 1.5, "#888888")
    
    fig.savefig("/home/z/my-project/download/architecture.png", dpi=200, bbox_inches="tight", pad_inches=0.2, facecolor="white", edgecolor="none")
    plt.close(fig)
    print("Architecture diagram saved.")

# ====== Chart 4: Risk Assessment Heatmap ======
def risk_heatmap():
    risks = ["Data Privacy\nBreach", "Agent Hallucination", "Crisis False\nPositive", "Wearable API\nFailure", "Latency\nSpike"]
    dimensions = ["Likelihood", "Impact", "Detectability", "Risk Score"]
    
    data = np.array([
        [2, 5, 4, 3.7],
        [4, 3, 3, 3.3],
        [3, 5, 2, 3.3],
        [3, 2, 4, 3.0],
        [3, 3, 4, 3.3],
    ])
    
    fig, ax = plt.subplots(figsize=(10, 6))
    im = ax.imshow(data, cmap="YlOrRd", aspect="auto", vmin=1, vmax=5)
    
    ax.set_xticks(range(len(dimensions)))
    ax.set_yticks(range(len(risks)))
    ax.set_xticklabels(dimensions, fontsize=11, color=TEXT)
    ax.set_yticklabels(risks, fontsize=10, color=TEXT)
    
    for i in range(len(risks)):
        for j in range(len(dimensions)):
            val = data[i, j]
            color = "white" if val > 3.5 else "black"
            ax.text(j, i, f"{val:.1f}", ha="center", va="center", fontsize=12, color=color, fontweight='bold')
    
    fig.colorbar(im, ax=ax, shrink=0.8, label="Score (1-5)")
    ax.set_title("Risk Assessment Matrix", fontsize=15, pad=15, color=TEXT, fontweight='bold')
    
    fig.savefig("/home/z/my-project/download/risk_heatmap.png", dpi=200, bbox_inches="tight", pad_inches=0.2, facecolor="white", edgecolor="none")
    plt.close(fig)
    print("Risk heatmap saved.")

# Generate all charts
radar_chart()
timeline_chart()
architecture_diagram()
risk_heatmap()
print("All charts generated successfully!")
