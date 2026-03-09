"""Common Standards Project data loader.

This module defines the interface for loading educational standards into the
knowledge graph. The actual data source (Common Standards Project JSON files)
is stubbed for now — this creates placeholder standards so the rest of the
pipeline works end-to-end.
"""

from __future__ import annotations


# ---------- Public interface ----------

def load_standards(conn, states: list[str] | None = None) -> int:
    """Load standards into the graph for the given states.

    Args:
        conn: Kuzu connection.
        states: State abbreviations to load. None = all states with data.

    Returns:
        Number of standards loaded.
    """
    standards = _get_placeholder_standards()

    if states:
        standards = [s for s in standards if s["state"] in states]

    count = 0
    for s in standards:
        conn.execute(
            "MERGE (st:Standard {code: $code}) "
            "SET st.description = $description, "
            "    st.description_plain = $plain, "
            "    st.domain = $domain, "
            "    st.cluster = $cluster",
            parameters={
                "code": s["code"],
                "description": s["description"],
                "plain": s["description_plain"],
                "domain": s["domain"],
                "cluster": s["cluster"],
            },
        )
        # Link to state
        conn.execute(
            "MATCH (st:State {abbreviation: $state}), (s:Standard {code: $code}) "
            "MERGE (st)-[:HAS_STANDARD]->(s)",
            parameters={"state": s["state"], "code": s["code"]},
        )
        # Link to grade
        conn.execute(
            "MATCH (s:Standard {code: $code}), (g:Grade {level: $grade}) "
            "MERGE (s)-[:FOR_GRADE]->(g)",
            parameters={"code": s["code"], "grade": s["grade"]},
        )
        # Link to subject
        conn.execute(
            "MATCH (s:Standard {code: $code}), (sub:Subject {name: $subject}) "
            "MERGE (s)-[:FOR_SUBJECT]->(sub)",
            parameters={"code": s["code"], "subject": s["subject"]},
        )
        count += 1

    return count


def _get_placeholder_standards() -> list[dict]:
    """Return placeholder standards for Oregon grades K-5.

    TODO: Replace with actual Common Standards Project JSON loader.
    These are real CCSS codes with simplified descriptions for development.
    """
    OR = "OR"
    standards = []

    # --- Math K ---
    _add = standards.append
    _add({"state": OR, "grade": "K", "subject": "Math", "code": "K.CC.1", "domain": "Counting & Cardinality", "cluster": "Know number names and the count sequence", "description": "Count to 100 by ones and by tens.", "description_plain": "Your child can count to 100 by ones and by tens."})
    _add({"state": OR, "grade": "K", "subject": "Math", "code": "K.CC.2", "domain": "Counting & Cardinality", "cluster": "Know number names and the count sequence", "description": "Count forward beginning from a given number within the known sequence.", "description_plain": "Your child can count forward starting from any number (not just 1)."})
    _add({"state": OR, "grade": "K", "subject": "Math", "code": "K.OA.1", "domain": "Operations & Algebraic Thinking", "cluster": "Understand addition as putting together", "description": "Represent addition and subtraction with objects, fingers, mental images, drawings, sounds, acting out situations, verbal explanations, expressions, or equations.", "description_plain": "Your child can show addition and subtraction using objects, drawings, or words."})
    _add({"state": OR, "grade": "K", "subject": "Math", "code": "K.G.1", "domain": "Geometry", "cluster": "Identify and describe shapes", "description": "Describe objects in the environment using names of shapes, and describe the relative positions of these objects.", "description_plain": "Your child can name shapes they see around them and describe where things are."})

    # --- Math 1 ---
    _add({"state": OR, "grade": "1", "subject": "Math", "code": "1.OA.1", "domain": "Operations & Algebraic Thinking", "cluster": "Represent and solve problems", "description": "Use addition and subtraction within 20 to solve word problems.", "description_plain": "Your child can solve simple addition and subtraction word problems up to 20."})
    _add({"state": OR, "grade": "1", "subject": "Math", "code": "1.NBT.1", "domain": "Number & Operations in Base Ten", "cluster": "Extend the counting sequence", "description": "Count to 120, starting at any number less than 120.", "description_plain": "Your child can count to 120, starting from any number."})
    _add({"state": OR, "grade": "1", "subject": "Math", "code": "1.MD.1", "domain": "Measurement & Data", "cluster": "Measure lengths indirectly", "description": "Order three objects by length; compare the lengths of two objects indirectly by using a third object.", "description_plain": "Your child can put things in order by length and compare sizes."})

    # --- Math 2 ---
    _add({"state": OR, "grade": "2", "subject": "Math", "code": "2.OA.1", "domain": "Operations & Algebraic Thinking", "cluster": "Represent and solve problems", "description": "Use addition and subtraction within 100 to solve one- and two-step word problems.", "description_plain": "Your child can solve word problems using addition and subtraction up to 100."})
    _add({"state": OR, "grade": "2", "subject": "Math", "code": "2.NBT.1", "domain": "Number & Operations in Base Ten", "cluster": "Understand place value", "description": "Understand that the three digits of a three-digit number represent amounts of hundreds, tens, and ones.", "description_plain": "Your child understands that digits in a number have different values (hundreds, tens, ones)."})
    _add({"state": OR, "grade": "2", "subject": "Math", "code": "2.MD.1", "domain": "Measurement & Data", "cluster": "Measure and estimate lengths", "description": "Measure the length of an object by selecting and using appropriate tools such as rulers, yardsticks, meter sticks, and measuring tapes.", "description_plain": "Your child can measure things using rulers and other measuring tools."})

    # --- Math 3 ---
    _add({"state": OR, "grade": "3", "subject": "Math", "code": "3.OA.1", "domain": "Operations & Algebraic Thinking", "cluster": "Represent and solve problems involving multiplication and division", "description": "Interpret products of whole numbers.", "description_plain": "Your child understands what multiplication means (e.g., 5 x 7 is 5 groups of 7)."})
    _add({"state": OR, "grade": "3", "subject": "Math", "code": "3.NF.1", "domain": "Number & Operations—Fractions", "cluster": "Develop understanding of fractions as numbers", "description": "Understand a fraction 1/b as the quantity formed by 1 part when a whole is partitioned into b equal parts.", "description_plain": "Your child understands basic fractions like 1/2, 1/3, and 1/4."})

    # --- Science (NGSS-style) K-3 ---
    _add({"state": OR, "grade": "K", "subject": "Science", "code": "K-ESS2-2", "domain": "Earth's Systems", "cluster": "Weather and climate", "description": "Construct an argument supported by evidence for how plants and animals can change the environment to meet their needs.", "description_plain": "Your child can explain how plants and animals change their environment."})
    _add({"state": OR, "grade": "K", "subject": "Science", "code": "K-LS1-1", "domain": "From Molecules to Organisms", "cluster": "Structure and function", "description": "Use observations to describe patterns of what plants and animals need to survive.", "description_plain": "Your child can describe what plants and animals need to live."})

    _add({"state": OR, "grade": "1", "subject": "Science", "code": "1-LS1-1", "domain": "From Molecules to Organisms", "cluster": "Structure and function", "description": "Use materials to design a solution to a human problem by mimicking how plants and/or animals use their external parts to help them survive.", "description_plain": "Your child can design something inspired by how animals or plants solve problems."})
    _add({"state": OR, "grade": "1", "subject": "Science", "code": "1-ESS1-1", "domain": "Earth's Place in the Universe", "cluster": "The Universe and its Stars", "description": "Use observations of the sun, moon, and stars to describe patterns that can be predicted.", "description_plain": "Your child can describe patterns they notice in the sun, moon, and stars."})

    _add({"state": OR, "grade": "2", "subject": "Science", "code": "2-LS4-1", "domain": "Biological Evolution: Unity and Diversity", "cluster": "Biodiversity and humans", "description": "Make observations of plants and animals to compare the diversity of life in different habitats.", "description_plain": "Your child can compare the different plants and animals in different places."})
    _add({"state": OR, "grade": "2", "subject": "Science", "code": "2-PS1-1", "domain": "Matter and its Interactions", "cluster": "Structure and properties of matter", "description": "Plan and conduct an investigation to describe and classify different kinds of materials by their observable properties.", "description_plain": "Your child can sort materials by how they look, feel, and behave."})

    _add({"state": OR, "grade": "3", "subject": "Science", "code": "3-LS1-1", "domain": "From Molecules to Organisms", "cluster": "Structure and function", "description": "Develop models to describe that organisms have unique and diverse life cycles.", "description_plain": "Your child can describe different life cycles of animals and plants."})

    # --- Literacy K-3 ---
    _add({"state": OR, "grade": "K", "subject": "Language Arts", "code": "K.RL.1", "domain": "Reading Literature", "cluster": "Key ideas and details", "description": "With prompting and support, ask and answer questions about key details in a text.", "description_plain": "With your help, your child can ask and answer questions about a story."})
    _add({"state": OR, "grade": "1", "subject": "Language Arts", "code": "1.RL.1", "domain": "Reading Literature", "cluster": "Key ideas and details", "description": "Ask and answer questions about key details in a text.", "description_plain": "Your child can ask and answer questions about what they read."})
    _add({"state": OR, "grade": "2", "subject": "Language Arts", "code": "2.RL.1", "domain": "Reading Literature", "cluster": "Key ideas and details", "description": "Ask and answer such questions as who, what, where, when, why, and how to demonstrate understanding of key details in a text.", "description_plain": "Your child can answer who/what/where/when/why/how questions about a story."})
    _add({"state": OR, "grade": "3", "subject": "Language Arts", "code": "3.RL.1", "domain": "Reading Literature", "cluster": "Key ideas and details", "description": "Ask and answer questions to demonstrate understanding of a text, referring explicitly to the text as the basis for the answers.", "description_plain": "Your child can find answers in the text to support their understanding."})

    # --- Language Arts: Writing K-3 ---
    _add({"state": OR, "grade": "K", "subject": "Language Arts", "code": "K.W.2", "domain": "Writing", "cluster": "Text types and purposes", "description": "Use a combination of drawing, dictating, and writing to compose informative/explanatory texts.", "description_plain": "Your child can draw, dictate, or write to share information about a topic."})
    _add({"state": OR, "grade": "1", "subject": "Language Arts", "code": "1.W.3", "domain": "Writing", "cluster": "Text types and purposes", "description": "Write narratives in which they recount two or more appropriately sequenced events.", "description_plain": "Your child can write a short story with events in order."})
    _add({"state": OR, "grade": "2", "subject": "Language Arts", "code": "2.W.3", "domain": "Writing", "cluster": "Text types and purposes", "description": "Write narratives in which they recount a well-elaborated event or short sequence of events.", "description_plain": "Your child can write a story with details about what happened."})
    _add({"state": OR, "grade": "3", "subject": "Language Arts", "code": "3.W.1", "domain": "Writing", "cluster": "Text types and purposes", "description": "Write opinion pieces on topics or texts, supporting a point of view with reasons.", "description_plain": "Your child can write their opinion and give reasons to support it."})

    # --- Social Studies K-3 (Oregon-specific style) ---
    _add({"state": OR, "grade": "K", "subject": "Social Studies", "code": "K.SS.1", "domain": "Civics", "cluster": "Civic participation", "description": "Identify and describe the roles and responsibilities of people in authority.", "description_plain": "Your child can describe what community helpers do."})
    _add({"state": OR, "grade": "1", "subject": "Social Studies", "code": "1.SS.1", "domain": "Geography", "cluster": "The world in spatial terms", "description": "Identify and describe the physical and human characteristics of places.", "description_plain": "Your child can describe features of their neighborhood and community."})
    _add({"state": OR, "grade": "2", "subject": "Social Studies", "code": "2.SS.1", "domain": "History", "cluster": "Historical knowledge", "description": "Identify and compare past and present ways of doing things.", "description_plain": "Your child can compare how people did things long ago vs. today."})
    _add({"state": OR, "grade": "3", "subject": "Social Studies", "code": "3.SS.1", "domain": "Geography", "cluster": "The world in spatial terms", "description": "Use maps, globes, and other geographic tools to locate and describe places.", "description_plain": "Your child can use maps and globes to find and describe places."})

    return standards
