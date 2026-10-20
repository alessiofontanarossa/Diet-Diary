import os
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'database.txt')

class Food(BaseModel):
    name: str
    carbs: float
    fats: float
    proteins: float
    salt: float = 0.0
    fiber: float = 0.0
    calories: float = 0.0

def calculate_calories(carbs, fats, proteins):
    return 4 * carbs + 9 * fats + 4 * proteins

def levenshtein_distance(s1, s2):
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)

    if len(s2) == 0:
        return len(s1)

    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row

    return previous_row[-1]

def read_db() -> List[Food]:
    if not os.path.exists(DB_PATH):
        return []
    foods = []
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                foods.append(Food(**data))
    return foods

def write_db(foods: List[Food]):
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        for food in foods:
            f.write(json.dumps(food.dict()) + '\n')

@app.get("/foods", response_model=List[Food])
def get_foods():
    return read_db()

@app.post("/foods", response_model=Food)
def add_food(food: Food):
    foods = read_db()
    for f in foods:
        if f.name.lower() == food.name.lower():
            raise HTTPException(status_code=400, detail="Food already exists")
    food.calories = calculate_calories(food.carbs, food.fats, food.proteins)
    foods.append(food)
    write_db(foods)
    return food

@app.put("/foods/{food_name}", response_model=Food)
def update_food(food_name: str, food: Food):
    foods = read_db()
    for i, f in enumerate(foods):
        if f.name.lower() == food_name.lower():
            food.calories = calculate_calories(food.carbs, food.fats, food.proteins)
            food.name = f.name # preserve original case for name if not changed, or use the new one
            foods[i] = food
            write_db(foods)
            return food
    raise HTTPException(status_code=404, detail="Food not found")

@app.delete("/foods/{food_name}")
def delete_food(food_name: str):
    foods = read_db()
    for i, f in enumerate(foods):
        if f.name.lower() == food_name.lower():
            del foods[i]
            write_db(foods)
            return {"message": "Food deleted successfully"}
    raise HTTPException(status_code=404, detail="Food not found")

def compute_search_score(query: str, name: str) -> float:
    q = query.lower()
    n = name.lower()
    if n == q:
        return 0.0
    if n.startswith(q):
        return 1.0
    if q in n:
        return 2.0
    return 3.0 + levenshtein_distance(q, n)

@app.get("/foods/search", response_model=List[Food])
def search_food(q: str):
    foods = read_db()
    # Sort by improved metric
    foods.sort(key=lambda x: compute_search_score(q, x.name))
    return foods[:10]

# --- Giornate Tipo ---
PLANS_DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'giornate_tipo.txt')

class DailyPlanItem(BaseModel):
    food: Food
    weight: float

class DailyPlanDB(BaseModel):
    name: str
    items: List[DailyPlanItem]

def read_plans_db() -> List[DailyPlanDB]:
    if not os.path.exists(PLANS_DB_PATH):
        return []
    plans = []
    with open(PLANS_DB_PATH, 'r', encoding='utf-8') as f:
        for line in f:
            if line.strip():
                data = json.loads(line)
                plans.append(DailyPlanDB(**data))
    return plans

def write_plans_db(plans: List[DailyPlanDB]):
    with open(PLANS_DB_PATH, 'w', encoding='utf-8') as f:
        for plan in plans:
            f.write(json.dumps(plan.dict()) + '\n')

@app.get("/plans", response_model=List[DailyPlanDB])
def get_plans():
    return read_plans_db()

def generate_exports(plans):
    base_dir = os.path.dirname(os.path.dirname(__file__))
    export_path_txt = os.path.join(base_dir, 'giornate_tipo_stampa.txt')
    export_path_xlsx = os.path.join(base_dir, 'giornate_tipo_stampa.xlsx')
    
    with open(export_path_txt, 'w', encoding='utf-8') as f:
        for p in plans:
            f.write(f"{p.name}\n")
            if p.items:
                items_str = ", ".join([f"{item.food.name} ({item.weight}g)" for item in p.items])
                f.write(f"{items_str}\n")
            f.write("\n")
            
    try:
        import pandas as pd
        data_dict = {}
        max_len = 0
        
        for p in plans:
            foods_list = [f"{item.food.name} ({item.weight}g)" for item in p.items]
            data_dict[p.name] = foods_list
            if len(foods_list) > max_len:
                max_len = len(foods_list)
                
        for key in data_dict:
            data_dict[key].extend([""] * (max_len - len(data_dict[key])))
            
        if data_dict:
            df = pd.DataFrame(data_dict)
            df.to_excel(export_path_xlsx, index=False)
        else:
            pd.DataFrame().to_excel(export_path_xlsx, index=False)
    except ImportError:
        pass

@app.post("/plans", response_model=DailyPlanDB)
def add_plan(plan: DailyPlanDB):
    plans = read_plans_db()
    for p in plans:
        if p.name.lower() == plan.name.lower():
            raise HTTPException(status_code=400, detail="Plan already exists")
    plans.append(plan)
    write_plans_db(plans)
    generate_exports(plans)
    return plan

@app.delete("/plans/{plan_name}")
def delete_plan(plan_name: str):
    plans = read_plans_db()
    for i, p in enumerate(plans):
        if p.name.lower() == plan_name.lower():
            del plans[i]
            write_plans_db(plans)
            generate_exports(plans)
            return {"message": "Plan deleted successfully"}
    raise HTTPException(status_code=404, detail="Plan not found")

@app.put("/plans/{plan_name}", response_model=DailyPlanDB)
def update_plan(plan_name: str, plan: DailyPlanDB):
    plans = read_plans_db()
    for i, p in enumerate(plans):
        if p.name.lower() == plan_name.lower():
            plans[i] = plan
            write_plans_db(plans)
            generate_exports(plans)
            return plan
    raise HTTPException(status_code=404, detail="Plan not found")

@app.post("/plans/export")
def export_plans():
    try:
        plans = read_plans_db()
        generate_exports(plans)
        return {"message": "Exported successfully", "path": "giornate_tipo_stampa txt & xlsx"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
