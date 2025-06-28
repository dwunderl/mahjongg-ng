"""Template definitions for Mahjong hand patterns."""
from itertools import permutations
from ..core import HandTemplate, pair, single, kong, pung

def sequence_and_kongs() -> HandTemplate:
    """Sequence and Kongs template."""
    template = HandTemplate(
        id="sequence_and_kongs",
        name="Sequence and Kongs",
        description="One sequence and two kongs",
        category="CONSECUTIVE RUN",
        catid="7",
        image="<green>112345 <red>1111 <black>1111"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots
    numbers = list(range(1, 6))  # 1-5 to ensure n+4 doesn't exceed 9
    
    for s1 in suits:
        other_suits = [x for x in suits if x != s1]
        s2 = other_suits[0]
        s3 = other_suits[1]
        for n in numbers:
            template.add_variation([
                pair(n, s1),
                single(n+1, s1),
                single(n+2, s1),
                single(n+3, s1),
                single(n+4, s1),
                kong(n, s2),
                kong(n, s3)
            ])
    
    return template

def p3_k6_p6_k9() -> HandTemplate:
    """p3 k6 p6 k9 template"""
    template = HandTemplate(
        id="p3_k6_p6_k9",
        name="p3 k6 p6 k9 in 3 suits",
        description="Pung of 3s, Kong of 6s (same suit), Pung of 6s (different suit), Kong of 9s",
        category="369",
        catid="1b",
        image="<green>333 6666 <red>666 <black>9999"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots

    for p in permutations(suits):
        s1 = p[0]  # First suit for pung(3) and kong(6)
        s2 = p[1]  # Second suit for pung(6)
        s3 = p[2]  # Third suit for kong(9)
        
        template.add_variation([
            pung(3, s1),
            kong(6, s1),
            pung(6, s2),
            kong(9, s3)
        ])
    
    return template

def like_kong_kong_pair() -> HandTemplate:
    """Like Kong Kong Pair template."""
    template = HandTemplate(
        id="like_kong_kong_pair",
        name="Like Kong Kong Pair",
        description="Two kongs and a pair of the same number",
        category="ANY LIKE NUMBERS",
        catid="1",
        image="<black>FF <green>1111 D <red>1111 D <black>11"
    )
    
    numbers = list(range(1, 10))  # 1-9
    suits = ['b', 'c', 'd']  # bamboo, characters, dots
    
    # Add variations with flowers and dragons
    for s1 in suits:
        other_suits = [x for x in suits if x != s1]
        s2 = other_suits[0]
        s3 = other_suits[1]
        
        for n in numbers:
            # Variation with flowers and dragons
            template.add_variation([
                pair('F'),  # Pair of flowers (no suit needed)
                kong(n, s2),  # Kong in first suit
                single('D',s2),  # White dragon (no suit needed)
                kong(n, s3),  # Kong in second suit
                single('D',s3),  # White dragon (no suit needed)
                pair(n, s1)   # Pair in third suit
            ])
                
    return template

def even_pungs_2468() -> HandTemplate:
    """2-4-6-8 Even Pungs template."""
    template = HandTemplate(
        id="even_pungs_2468",
        name="2-4-6-8 Even Pungs",
        description="Pungs of even numbers 2, 4, 6, 8",
        category="EVEN NUMBERS",
        catid="4",
        image="<black>FFFF <green>2468 <red>222 <black>222"
    )
    
    suits = ['b', 'c', 'd']  # bamboo, characters, dots
    even_numbers = [2, 4, 6, 8]
    
    for s1 in suits:
        other_suits = [x for x in suits if x != s1]
        s2 = other_suits[0]
        s3 = other_suits[1]
        for en in even_numbers:
            template.add_variation([
                kong('F'),
                single(2, s1),
                single(4, s1),
                single(6, s1),
                single(8, s1),
                pung(en, s2),
                pung(en, s3)
            ])

    
    return template
