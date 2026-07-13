import React, { useState, useEffect } from 'react';
import './ConsultationBooking.css';

const daysData = [
    { day: 1, title: "Day 1", meals: [ { id: 'd1m1', time: 'Morning', food: 'Oats with Almond Milk & Berries' }, { id: 'd1m2', time: 'Lunch', food: 'Quinoa Salad with Grilled Tofu' }, { id: 'd1m3', time: 'Evening', food: 'Green Tea & Roasted Makhana' }, { id: 'd1m4', time: 'Dinner', food: 'Boiled Matta Rice with Dal' } ] },
    { day: 2, title: "Day 2", meals: [ { id: 'd2m1', time: 'Morning', food: 'Puttu with Kadala Curry' }, { id: 'd2m2', time: 'Lunch', food: 'Brown Rice with Mixed Veg Stew' }, { id: 'd2m3', time: 'Evening', food: 'Fruit Bowl (Papaya & Apple)' }, { id: 'd2m4', time: 'Dinner', food: 'Vegetable Soup & 2 Chapathis' } ] },
    { day: 3, title: "Day 3", meals: [ { id: 'd3m1', time: 'Morning', food: 'Ragi Porridge' }, { id: 'd3m2', time: 'Lunch', food: 'Red Rice with Fish Curry (or Paneer)' }, { id: 'd3m3', time: 'Evening', food: 'Black Coffee & Handful of Almonds' }, { id: 'd3m4', time: 'Dinner', food: 'Broken Rice Upma' } ] },
    { day: 4, title: "Day 4", meals: [ { id: 'd4m1', time: 'Morning', food: 'Idli with Sambar' }, { id: 'd4m2', time: 'Lunch', food: 'Kerala Matta Rice with Avial' }, { id: 'd4m3', time: 'Evening', food: 'Sprout Salad' }, { id: 'd4m4', time: 'Dinner', food: 'Grilled Chicken (or Soya) Salad' } ] },
    { day: 5, title: "Day 5", meals: [ { id: 'd5m1', time: 'Morning', food: 'Whole Wheat Dosa' }, { id: 'd5m2', time: 'Lunch', food: 'Traditional Rice with Spinach Curry' }, { id: 'd5m3', time: 'Evening', food: 'Cucumber & Carrot Slices' }, { id: 'd5m4', time: 'Dinner', food: 'Oats Khichdi' } ] },
    { day: 6, title: "Day 6", meals: [ { id: 'd6m1', time: 'Morning', food: 'Appam with Vegetable Stew' }, { id: 'd6m2', time: 'Lunch', food: 'Boiled Matta Rice with Rasam' }, { id: 'd6m3', time: 'Evening', food: 'Boiled Sweet Potato' }, { id: 'd6m4', time: 'Dinner', food: 'Tomato Soup & Salad' } ] },
    { day: 7, title: "Day 7", meals: [ { id: 'd7m1', time: 'Morning', food: 'Poha with Peanuts' }, { id: 'd7m2', time: 'Lunch', food: 'Red Rice with Rajma Curry' }, { id: 'd7m3', time: 'Evening', food: 'Buttermilk & Roasted Chana' }, { id: 'd7m4', time: 'Dinner', food: 'Stir-fried Vegetables' } ] }
];

const DietDashboard: React.FC = () => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authInput, setAuthInput] = useState('');
    
    const [openDay, setOpenDay] = useState<number>(1);
    const [frozenDays, setFrozenDays] = useState<Record<number, boolean>>({});
    const [completedMeals, setCompletedMeals] = useState<Record<string, boolean>>({});

    useEffect(() => {
        document.body.classList.add('consultation-page-body');
        return () => {
            document.body.classList.remove('consultation-page-body');
        };
    }, []);

    const handleLogin = () => {
        if (authInput.trim().length > 0) {
            setIsAuthenticated(true);
        } else {
            alert('Please enter a valid Phone Number or ID');
        }
    };

    const handleMealToggle = (dayNum: number, mealId: string) => {
        if (frozenDays[dayNum]) return; // Cannot uncheck if day is frozen

        const newCompleted = { ...completedMeals, [mealId]: !completedMeals[mealId] };
        setCompletedMeals(newCompleted);

        // Check if all meals for this day are completed
        const dayMeals = daysData.find(d => d.day === dayNum)?.meals || [];
        const allCompleted = dayMeals.every(m => newCompleted[m.id]);

        if (allCompleted) {
            setFrozenDays(prev => ({ ...prev, [dayNum]: true }));
            // Automatically open the next day
            setOpenDay(dayNum + 1);
        }
    };

    const toggleAccordion = (dayNum: number) => {
        if (openDay === dayNum) {
            setOpenDay(0);
        } else {
            setOpenDay(dayNum);
        }
    };

    return (
        <div className="consultation-wrapper">
            <style>
                {`
                    .diet-meal-item {
                        transition: all 0.3s ease;
                    }
                    .frozen-day .accordion-button {
                        background-color: #e9ecef !important;
                        color: #6c757d !important;
                        cursor: not-allowed;
                    }
                    .frozen-day .accordion-button::after {
                        content: "\\f00c";
                        font-family: "Font Awesome 6 Free";
                        font-weight: 900;
                        background-image: none;
                        color: #198754;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                    }
                    .meal-completed {
                        display: none !important;
                    }
                    .meal-checkbox {
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                    }
                `}
            </style>
            
            <div className="page-content bg-light">
                <section className="content-inner-1" style={{ minHeight: '70vh' }}>
                    <div className="container">
                        <div className="row justify-content-center">
                            <div className="col-lg-8">
                                
                                {!isAuthenticated ? (
                                    <div id="diet-login-section" className="card shadow-sm border-0 mb-4" style={{ borderRadius: '20px' }}>
                                        <div className="card-body p-5 text-center">
                                            <h2 className="dz-title mb-3">Access Your Diet Plan</h2>
                                            <p className="mb-4">Enter your registered phone number or Diet ID to view your personalized 7-day schedule.</p>
                                            <div className="input-group mb-4 mx-auto" style={{ maxWidth: '400px' }}>
                                                <input 
                                                    type="text" 
                                                    id="diet-auth-input" 
                                                    className="form-control form-control-lg" 
                                                    placeholder="Phone Number or ID"
                                                    value={authInput}
                                                    onChange={(e) => setAuthInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleLogin();
                                                    }}
                                                />
                                                <button className="btn btn-secondary" type="button" id="btn-access-diet" onClick={handleLogin}>
                                                    View Plan
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div id="diet-tracker-section">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h2 className="dz-title m-0">Your 7-Day Diet Schedule</h2>
                                            <span className="badge bg-success p-2 fs-6 rounded-pill">Active Plan</span>
                                        </div>

                                        <div className="accordion dz-accordion style-1" id="accordionDiet">
                                            {daysData.map(dayInfo => {
                                                const isFrozen = frozenDays[dayInfo.day];
                                                const isOpen = openDay === dayInfo.day;

                                                return (
                                                    <div 
                                                        key={dayInfo.day} 
                                                        className={`accordion-item shadow-sm mb-3 border-0 rounded-4 overflow-hidden ${isFrozen ? 'frozen-day' : ''}`}
                                                    >
                                                        <h2 className="accordion-header">
                                                            <button 
                                                                className={`accordion-button fs-4 fw-bold ${!isOpen ? 'collapsed' : ''}`} 
                                                                type="button" 
                                                                onClick={() => toggleAccordion(dayInfo.day)}
                                                            >
                                                                {dayInfo.title}
                                                            </button>
                                                        </h2>
                                                        <div className={`accordion-collapse collapse ${isOpen ? 'show' : ''}`}>
                                                            <div className="accordion-body p-0">
                                                                {dayInfo.meals.map(meal => (
                                                                    <div key={meal.id} className="diet-meal-item d-flex justify-content-between align-items-center p-3 border-bottom">
                                                                        <div>
                                                                            <h5 className="mb-1 text-primary">
                                                                                <i className="fa-regular fa-clock me-2"></i>{meal.time}
                                                                            </h5>
                                                                            <p className={`mb-0 text-muted fs-6 meal-desc ${isFrozen ? 'meal-completed' : ''}`}>
                                                                                {meal.food}
                                                                            </p>
                                                                        </div>
                                                                        <div className="form-check form-switch">
                                                                            <input 
                                                                                className="form-check-input meal-checkbox" 
                                                                                type="checkbox" 
                                                                                checked={completedMeals[meal.id] || false}
                                                                                disabled={isFrozen}
                                                                                onChange={() => handleMealToggle(dayInfo.day, meal.id)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {isFrozen && (
                                                                    <div className="p-3 text-center frozen-message">
                                                                        <div className="alert alert-success m-0 rounded-3">
                                                                            <i className="fa-solid fa-check-circle me-2"></i> You have successfully completed all meals for this day!
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default DietDashboard;
