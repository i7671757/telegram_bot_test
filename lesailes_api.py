import requests

def get_categories():
    url = "https://api.lesailes.uz/api/categories"
    
    try:
        response = requests.get(url)
        response.raise_for_status()  # Raise an exception for bad status codes
        
        data = response.json()
        return data
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data: {e}")
        return None

if __name__ == "__main__":
    categories = get_categories()
    if categories:
        print("Categories fetched successfully!")
        print(categories) 