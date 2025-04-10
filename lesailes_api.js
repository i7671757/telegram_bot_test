async function getCategories() {
    try {
        const response = await fetch('https://api.lesailes.uz/api/categories/root');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching categories:', error);
        return null;
    }
}

// Run the function
getCategories()
    .then(data => {
        if (data) {
            console.log('Categories fetched successfully!');
            console.log(JSON.stringify(data, null, 2));
        }
    })
    .catch(error => {
        console.error('Error:', error);
    }); 