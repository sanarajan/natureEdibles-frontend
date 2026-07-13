import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { createConsultationBooking, getAvailableSlots, getUserConsultationSettings } from '../../../services/api/consultationApi';
import userApiClient from '../../../services/userApiClient';
import { Loader2, AlertCircle, Upload, Send } from 'lucide-react';
import Select from 'react-select';
import './ConsultationBooking.css';

const STORAGE_KEY = 'natureEdibles_consultationForm';

const ConsultationBooking: React.FC = () => {
    const navigate = useNavigate();
    const formRef = useRef<HTMLFormElement>(null);
    const [loading, setLoading] = useState(false);
    const [settings, setSettings] = useState<any>(null);
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [fetchingSlots, setFetchingSlots] = useState(false);
    const [slotMessage, setSlotMessage] = useState<string>('No slots available');
    
    const [isSuccess, setIsSuccess] = useState(false);
    const [medicalReports, setMedicalReports] = useState<File[]>([]);
    
    // Payment Settings State
    const [paymentSettings, setPaymentSettings] = useState<{_id?: string, qrCodeImage?: string, upiId?: string, phoneNumber?: string} | null>(null);
    const [fetchingPayment, setFetchingPayment] = useState(false);
    
    // Country Options
    const [countryOptions, setCountryOptions] = useState<{value: string, label: string}[]>([]);
    
    useEffect(() => {
        document.body.classList.add('consultation-page-body');
        return () => {
            document.body.classList.remove('consultation-page-body');
        };
    }, []);

    useEffect(() => {
        fetch('https://restcountries.com/v3.1/all?fields=name')
            .then(res => res.json())
            .then(data => {
                const countries = data.map((c: any) => c.name.common).sort();
                const options = countries.map((c: string) => ({ value: c, label: c }));
                const priority = ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'];
                const priorityOptions = priority.map(p => ({ value: p, label: p }));
                const otherOptions = options.filter((o: any) => !priority.includes(o.value));
                setCountryOptions([...priorityOptions, ...otherOptions]);
            })
            .catch(() => {
                setCountryOptions([
                    { value: 'India', label: 'India' },
                    { value: 'United States', label: 'United States' },
                    { value: 'United Kingdom', label: 'United Kingdom' },
                    { value: 'Canada', label: 'Canada' },
                    { value: 'Australia', label: 'Australia' }
                ]);
            });
    }, []);

    const diagnosedOptions = [
        { value: 'PCOS', label: 'PCOS' },
        { value: 'Endometriosis', label: 'Endometriosis' },
        { value: 'Low AMH', label: 'Low AMH' },
        { value: 'Low Sperm Count', label: 'Low Sperm Count' },
        { value: 'Fibroids', label: 'Fibroids' },
        { value: 'Thyroid Disorder', label: 'Thyroid Disorder' },
        { value: 'Irregular Periods', label: 'Irregular Periods' },
        { value: 'Male Factor Infertility', label: 'Male Factor Infertility' }
    ];
    
    // Form State
    const [formData, setFormData] = useState({
        fullName: '', age: '', gender: '', maritalStatus: '',
        height: '', currentWeight: '', occupation: '', contactNumber: '', city: '', country: '',
        mainHealthIssue: '', yearsFacingIssue: '',
        medicalTreatment: '', treatmentDetails: '', currentMedicines: '', takingMedicines: '',
        seekingInfertilityConsultation: '',
        tryingToConceiveSince: '', miscarriageHistory: '', ivfIui: '', menstrualCycle: '', diagnosedCondition: [] as string[],
        stressLevel: '', exercise: '', wakeUpTime: '', sleepTime: '',
        foodPreference: '', teaCoffee: '', sugar: '', outsideFood: '', riceWheat: '', foodAllergies: '', waterIntake: '', bowelMovement: '',
        symptoms: [] as string[],
        appointmentDate: '', appointmentTime: '',
        readyForNaturalDiet: '', readyToAvoidSugar: '', familySupport: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed.appointmentDate) parsed.appointmentDate = '';
                if (parsed.appointmentTime) parsed.appointmentTime = '';
                if (parsed.diagnosedCondition && typeof parsed.diagnosedCondition === 'string') {
                     parsed.diagnosedCondition = [];
                }
                setFormData(prev => ({ ...prev, ...parsed }));
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        if (!isSuccess) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
        }
    }, [formData, isSuccess]);

    useEffect(() => {
        setFetchingPayment(true);
        userApiClient.get('/user/payment-settings')
            .then(res => {
                if (res.data.success && res.data.settings) {
                    setPaymentSettings(res.data.settings);
                }
            })
            .catch(err => console.error('Failed to fetch payment settings:', err))
            .finally(() => setFetchingPayment(false));
    }, []);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await getUserConsultationSettings();
                if (res.success) setSettings(res.data);
            } catch (error) {}
        };
        fetchSettings();
    }, []);

    useEffect(() => {
        if (formData.appointmentDate) fetchSlots(formData.appointmentDate);
    }, [formData.appointmentDate]);

    const fetchSlots = async (date: string) => {
        setFetchingSlots(true);
        setFormData(prev => ({ ...prev, appointmentTime: '' }));
        try {
            const res = await getAvailableSlots(date);
            if (res.success) {
                setAvailableSlots(res.data);
                if (res.data.length === 0) setSlotMessage(res.message || 'No slots available');
            } else {
                setAvailableSlots([]);
                setSlotMessage(res.message || 'No slots available');
            }
        } catch (error: any) {
            setAvailableSlots([]);
            setSlotMessage(error.response?.data?.message || 'Error fetching slots');
        } finally { setFetchingSlots(false); }
    };

    const validateField = (name: string, value: any, currentFormData: any = formData): string => {
        const optionals = ['tryingToConceiveSince', 'miscarriageHistory', 'ivfIui', 'menstrualCycle', 'diagnosedCondition', 'foodAllergies'];
        
        let isRequired = !optionals.includes(name);

        if (name === 'treatmentDetails' && currentFormData.medicalTreatment !== 'Yes') isRequired = false;
        if (name === 'currentMedicines' && currentFormData.takingMedicines !== 'Yes') isRequired = false;
        
        const mainHealthIssue = currentFormData.mainHealthIssue || '';
        if (name === 'seekingInfertilityConsultation' && !(mainHealthIssue === 'PCOS' || mainHealthIssue.includes('PCOS'))) isRequired = false;
        
        if (isRequired && (!value || (Array.isArray(value) && value.length === 0))) {
            const fieldNames: Record<string, string> = {
                fullName: 'Full Name', age: 'Age', gender: 'Gender', height: 'Height', currentWeight: 'Current Weight',
                maritalStatus: 'Marital Status', occupation: 'Occupation', contactNumber: 'Contact Number', city: 'City', country: 'Country',
                mainHealthIssue: 'Main Health Issue', yearsFacingIssue: 'Years Facing Issue', medicalTreatment: 'Medical Treatment',
                treatmentDetails: 'Treatment Details', takingMedicines: 'Taking Medicines', currentMedicines: 'Current Medicines',
                seekingInfertilityConsultation: 'Infertility Consultation', stressLevel: 'Stress Level', exercise: 'Exercise',
                wakeUpTime: 'Wake-up Time', sleepTime: 'Sleep Time', foodPreference: 'Food Preference', teaCoffee: 'Tea/Coffee',
                sugar: 'Sugar', outsideFood: 'Outside Food', riceWheat: 'Rice/Wheat', waterIntake: 'Water Intake',
                bowelMovement: 'Bowel Movement', symptoms: 'Symptoms', appointmentDate: 'Appointment Date', appointmentTime: 'Appointment Time',
                readyForNaturalDiet: 'Ready for Natural Diet', readyToAvoidSugar: 'Ready to Avoid Sugar', familySupport: 'Family Support'
            };
            return `${fieldNames[name] || 'This field'} is required.`;
        }
        
        if (name === 'contactNumber' && value) {
            if (!/^\+?\d+$/.test(value)) return 'Numbers only.';
            if (value.length < 8) return 'Please enter a valid phone number.';
        }
        if (name === 'age' && value) {
            if (isNaN(Number(value)) || Number(value) <= 0) return 'Please enter a valid age.';
        }
        if ((name === 'height' || name === 'currentWeight') && value) {
            if (isNaN(Number(value))) return 'Numbers only.';
        }
        return '';
    };

    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>, allowDecimal: boolean = false, allowPlus: boolean = false) => {
        const { name, value } = e.target;
        
        let regex;
        if (allowDecimal) {
            regex = /^[0-9]*\.?[0-9]*$/;
        } else if (allowPlus) {
            regex = /^\+?[0-9]*$/;
        } else {
            regex = /^[0-9]*$/;
        }

        const currentFormData = { ...formData, [name]: value };

        if (value === '' || regex.test(value)) {
            setFormData(currentFormData);
            setTouched(prev => ({ ...prev, [name]: true }));
            setErrors(prev => {
                const newErrors = { ...prev };
                newErrors[name] = validateField(name, value, currentFormData);
                return newErrors;
            });
        } else {
             setTouched(prev => ({ ...prev, [name]: true }));
             setErrors(prev => {
                 const newErrors = { ...prev };
                 newErrors[name] = 'Numbers only.';
                 return newErrors;
             });
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            if (name === 'symptoms') {
                const newSymptoms = checked 
                    ? [...formData.symptoms, value]
                    : formData.symptoms.filter(sym => sym !== value);
                
                const currentFormData = { ...formData, symptoms: newSymptoms };
                setFormData(currentFormData);
                setTouched(prev => ({ ...prev, symptoms: true }));
                setErrors(prev => {
                    const newErrors = { ...prev };
                    newErrors.symptoms = validateField('symptoms', newSymptoms, currentFormData);
                    return newErrors;
                });
                return;
            }
        }
        
        const currentFormData = { ...formData, [name]: value };
        setFormData(currentFormData);
        setTouched(prev => ({ ...prev, [name]: true }));
        setErrors(prev => {
            const newErrors = { ...prev };
            newErrors[name] = validateField(name, value, currentFormData);
            
            if (name === 'medicalTreatment') {
                newErrors.treatmentDetails = validateField('treatmentDetails', currentFormData.treatmentDetails, currentFormData);
            }
            if (name === 'takingMedicines') {
                newErrors.currentMedicines = validateField('currentMedicines', currentFormData.currentMedicines, currentFormData);
            }
            if (name === 'mainHealthIssue') {
                newErrors.seekingInfertilityConsultation = validateField('seekingInfertilityConsultation', currentFormData.seekingInfertilityConsultation, currentFormData);
            }
            return newErrors;
        });
    };

    const handleCountryChange = (selectedOption: any) => {
        const value = selectedOption ? selectedOption.value : '';
        const currentFormData = { ...formData, country: value };
        setFormData(currentFormData);
        setTouched(prev => ({ ...prev, country: true }));
        setErrors(prev => ({ ...prev, country: validateField('country', value, currentFormData) }));
    };

    const handleDiagnosedConditionChange = (selectedOptions: any) => {
        const values = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
        const currentFormData = { ...formData, diagnosedCondition: values };
        setFormData(currentFormData);
        setTouched(prev => ({ ...prev, diagnosedCondition: true }));
        setErrors(prev => ({ ...prev, diagnosedCondition: validateField('diagnosedCondition', values, currentFormData) }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setMedicalReports(Array.from(e.target.files));
        }
    };

    const validateAll = (): boolean => {
        const fields = [
            'fullName', 'age', 'gender', 'maritalStatus', 'contactNumber', 'city', 'country', 'occupation', 'height', 'currentWeight',
            'mainHealthIssue', 'yearsFacingIssue', 'medicalTreatment', 'treatmentDetails', 'currentMedicines', 'takingMedicines',
            'seekingInfertilityConsultation', 'stressLevel', 'exercise', 'wakeUpTime', 'sleepTime', 'foodPreference', 'teaCoffee', 
            'sugar', 'outsideFood', 'riceWheat', 'waterIntake', 'bowelMovement', 'symptoms',
            'appointmentDate', 'appointmentTime', 'readyForNaturalDiet', 'readyToAvoidSugar', 'familySupport'
        ];

        const newErrors: Record<string, string> = {};
        const newTouched: Record<string, boolean> = {};
        let isValid = true;

        fields.forEach(field => {
            const error = validateField(field, (formData as any)[field], formData);
            if (error) {
                newTouched[field] = true;
                newErrors[field] = error;
                isValid = false;
            }
        });

        if (!isValid) {
            setErrors(prev => ({ ...prev, ...newErrors }));
            setTouched(prev => ({ ...prev, ...newTouched }));
            toast.error('Please correct the highlighted fields.', { toastId: 'validationError' });
            
            setTimeout(() => {
                const firstErrorElement = formRef.current?.querySelector('[data-error="true"]') as HTMLElement;
                if (firstErrorElement) {
                    firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    firstErrorElement.focus();
                }
            }, 100);
        }
        return isValid;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validateAll()) return;
        
        setLoading(true);
        const payload = {
            ...formData,
            diagnosedCondition: formData.diagnosedCondition.join(', '),
            readyForNaturalDiet: formData.readyForNaturalDiet === 'Yes',
            readyToAvoidSugar: formData.readyToAvoidSugar === 'Yes',
            familySupport: formData.familySupport === 'Yes',
            vegetarian: formData.foodPreference === 'Vegetarian',
            nonVegetarian: formData.foodPreference === 'Non-Vegetarian',
            seekingInfertilityConsultation: formData.seekingInfertilityConsultation === 'Yes',
            paymentAccountId: paymentSettings ? paymentSettings._id : undefined
        };

        try {
            const res = await createConsultationBooking(payload);
            if (res.success) {
                setIsSuccess(true);
                localStorage.removeItem(STORAGE_KEY);
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                toast.error(res.message || 'Failed to book consultation');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Error booking consultation');
        } finally {
            setLoading(false);
        }
    };

    if (!settings) {
        return (
            <div className="consultation-wrapper flex justify-center items-center min-h-screen bg-[#F3F3F3]">
                <Loader2 className="animate-spin w-10 h-10 text-[#38996E]" />
            </div>
        );
    }

    if (settings.bookingEnabled === false) {
        return (
            <div className="consultation-wrapper flex flex-col justify-center items-center min-h-screen bg-[#F3F3F3] px-4">
                <div className="bg-white p-12 rounded-[6px] shadow-sm text-center max-w-lg">
                    <AlertCircle className="w-16 h-16 text-[#D23636] mx-auto mb-5" />
                    <h1 className="text-[1.75rem] font-bold text-[#2D2E2F] mb-3">Consultation Unavailable</h1>
                    <p className="text-[#666666] text-[1rem]">Bookings are temporarily disabled. Please check back later.</p>
                </div>
            </div>
        );
    }

    const inputClasses = "custom-input";
    const selectClasses = "custom-select";
    const labelClasses = "custom-label";
    const errorClasses = "validation-error-message";

    const symptomsList = [
        { id: 'sym1', label: 'Hair Fall' },
        { id: 'sym2', label: 'Acidity' },
        { id: 'sym3', label: 'Constipation' },
        { id: 'sym4', label: 'Bloating' },
        { id: 'sym5', label: 'White Discharge' },
        { id: 'sym6', label: 'Joint Pain' },
        { id: 'sym7', label: 'Skin Issues' },
        { id: 'sym8', label: 'Fatigue' },
        { id: 'sym9', label: 'Low Libido' },
        { id: 'sym10', label: 'Irregular Periods' },
    ];

    const reactSelectStyles = (isError: boolean = false) => ({
        control: (base: any, state: any) => ({
            ...base,
            height: '48px',
            minHeight: '48px',
            borderRadius: '10px',
            borderColor: isError ? '#dc3545' : (state.isFocused ? '#38996E' : '#D1D5DB'),
            boxShadow: isError ? '0 0 0 1px #dc3545' : (state.isFocused ? '0 0 0 1px #38996E' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)'),
            '&:hover': { borderColor: isError ? '#dc3545' : (state.isFocused ? '#38996E' : '#9CA3AF') },
            padding: '0 8px',
            fontSize: '15px'
        }),
        option: (base: any, state: any) => ({
            ...base,
            backgroundColor: state.isSelected ? '#38996E' : state.isFocused ? '#F6FFF7' : 'white',
            color: state.isSelected ? 'white' : '#1F2937',
            '&:active': { backgroundColor: '#38996E' }
        })
    });

    return (
        <div className="consultation-wrapper bg-white">
            <style>
                {`
                    .consultation-page .custom-checkbox-input {
                        opacity: 1 !important;
                        position: static !important;
                        width: 24px !important;
                        height: 24px !important;
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        background-color: #fff !important;
                        border: 2px solid #38996E !important;
                        border-radius: 4px !important;
                        margin-top: 0;
                        cursor: pointer;
                        transition: all 0.2s ease-in-out;
                    }
                    .consultation-page .custom-checkbox-input:checked {
                        background-color: #38996E !important;
                        border-color: #38996E !important;
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3e%3cpath fill='none' stroke='%23ffffff' stroke-linecap='round' stroke-linejoin='round' stroke-width='3' d='m6 10 3 3 6-6'/%3e%3c/svg%3e") !important;
                        background-size: 80% !important;
                        background-position: center !important;
                        background-repeat: no-repeat !important;
                    }
                    .consultation-page .custom-radio-input {
                        appearance: none !important;
                        -webkit-appearance: none !important;
                        width: 18px !important;
                        height: 18px !important;
                        border: 2px solid #38996E !important;
                        border-radius: 50% !important;
                        margin-right: 8px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        transition: all 0.2s ease-in-out;
                    }
                    .consultation-page .custom-radio-input:checked {
                        border-color: #38996E !important;
                        background-color: #38996E !important;
                    }
                    .consultation-page .custom-radio-input:checked::after {
                        content: '';
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        background-color: white;
                    }
                    .consultation-page .custom-select-bg {
                        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%239CA3AF' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e");
                        background-repeat: no-repeat;
                        background-position: right 1rem center;
                        background-size: 16px 12px;
                    }
                    @keyframes heroFadeIn {
                        from { opacity: 0; transform: translateY(15px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .consultation-page .section-card {
                        background-color: white;
                        border-radius: 20px;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                        padding: 32px;
                        margin-bottom: 32px;
                        animation: heroFadeIn 0.6s ease-out forwards;
                    }
                    @media (min-width: 768px) { .consultation-page .section-card { padding: 32px; } }
                    .consultation-page .form-container {
                        background-color: #F3FAEB;
                        border-radius: 18px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
                        padding: 32px;
                    }
                    @media (min-width: 768px) { .consultation-page .form-container { padding: 32px; } }
                    .consultation-page .custom-input, .consultation-page .custom-select {
                        height: 48px !important;
                        padding: 0 16px;
                        font-size: 15px;
                        border: 1px solid #d9d9d9;
                        border-radius: 10px;
                        width: 100%;
                        color: #333;
                        transition: all 0.3s;
                        box-sizing: border-box;
                    }
                    .consultation-page .custom-input:focus, .consultation-page .custom-select:focus {
                        outline: none;
                        border-color: #38996E;
                        box-shadow: 0 0 0 1px #38996E;
                    }
                    .consultation-page .custom-label {
                        display: block;
                        margin-bottom: 8px !important;
                        font-weight: 600;
                        color: #333;
                        font-size: 15px;
                        min-height: 22px; 
                    }
                    .consultation-page .form-group-mb {
                        margin-bottom: 28px !important;
                    }
                    .consultation-page .symptoms-col {
                        display: flex;
                        flex-direction: column;
                        gap: 16px;
                    }
                    .consultation-page .symptom-item {
                        display: flex;
                        align-items: center;
                        padding: 12px 16px;
                        border: 1px solid #eaeaea;
                        border-radius: 10px;
                        cursor: pointer;
                        transition: all 0.2s;
                        background: white;
                        margin-bottom: 0 !important;
                    }
                    .consultation-page .symptom-item:hover {
                        border-color: #2B7A58;
                        background: #F3FAEB;
                    }
                    .consultation-page .radio-group-horiz {
                        display: flex;
                        align-items: center;
                        gap: 32px;
                        height: 48px; /* align exactly with inputs */
                    }
                    .consultation-page .radio-label {
                        display: flex;
                        align-items: center;
                        font-weight: 500;
                        color: #333;
                        font-size: 15px;
                        cursor: pointer;
                        margin-bottom: 0;
                    }
                    .consultation-page .validation-error-message {
                        color: #dc3545;
                        font-size: 13px;
                        font-weight: 500;
                        margin-top: 4px;
                    }
                    .consultation-page .custom-input[data-error="true"],
                    .consultation-page .custom-select[data-error="true"],
                    .consultation-page .custom-radio-input[data-error="true"],
                    .consultation-page .custom-checkbox-input[data-error="true"] {
                        border-color: #dc3545 !important;
                    }
                `}
</style>
            
            {/* Premium Hero Banner */}
            <div 
                className="relative w-full h-[450px] bg-cover bg-center bg-no-repeat flex items-center justify-center" 
                style={{ backgroundImage: 'url("/im/biji-consultation.jpg")' }}
            >
                <div className="absolute inset-0" style={{ backgroundColor: 'rgba(10, 74, 43, 0.45)' }}></div>
                <div className="relative z-10 text-center px-4" style={{ animation: 'heroFadeIn 1.2s ease-out forwards' }}>
                    <h1 className="text-white text-4xl md:text-[52px] font-semibold mb-[28px] drop-shadow-md tracking-wide font-serif">
                        Consultation With Biji
                    </h1>
                    <p className="text-white text-sm md:text-base font-medium uppercase opacity-95 drop-shadow-sm" style={{ letterSpacing: '0.15em' }}>
                        Home &bull; Consultation
                    </p>
                </div>
            </div>

            <div className="consultation-page py-16 bg-[#F3F3F3]">
                <div className="container mx-auto px-4 max-w-[1200px]">
                    <div className="flex flex-wrap justify-center -mx-4">
                        <div className="w-full lg:w-10/12 xl:w-9/12 px-4">
                            <div className="form-container relative flex flex-col min-w-0 break-words border-0">
                                <div className="flex-auto">
                                    
                                    {!isSuccess ? (
                                        <>
                                            <div className="text-center mb-[28px]">
                                                <img src="/images/biji-consultation.jpg" alt="Consultation with Biji" className="max-w-full h-auto rounded-[6px] shadow-sm" style={{maxHeight: '450px', objectFit: 'cover', width: '100%'}} />
                                            </div>
                                            <h3 className="mb-[28px] text-center text-[1.5rem] md:text-[1.75rem] font-normal text-[#2D2E2F]">Consultation Registration Form</h3>
                                            
                                            <form ref={formRef} id="consultationForm" onSubmit={handleSubmit}>
                                                
                                                <div className="section-card">
                                                {/* 1. Basic Details */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">1</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Basic Details</h2></div>
                                                <div className="row">
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Full Name <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} className={inputClasses} data-error={!!errors.fullName}  placeholder="Enter your full name" required />
                                                        {errors.fullName && <div className={errorClasses}>{errors.fullName}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Age <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="number" name="age" value={formData.age} onChange={handleChange} className={inputClasses} data-error={!!errors.age}  placeholder="Enter your age" required />
                                                        {errors.age && <div className={errorClasses}>{errors.age}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Gender <span className="text-[#D23636] font-bold">*</span></label>
                                                        <select name="gender" value={formData.gender} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.gender} required>
                                                            <option value="">Select gender</option>
                                                            <option value="Male">Male</option>
                                                            <option value="Female">Female</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                        {errors.gender && <div className={errorClasses}>{errors.gender}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Height <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="height" value={formData.height} onChange={(e) => handleNumberChange(e, true)} className={inputClasses} placeholder="e.g. 170.5" data-error={!!errors.height} required />
                                                        {errors.height && <div className={errorClasses}>{errors.height}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Current Weight <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="currentWeight" value={formData.currentWeight} onChange={(e) => handleNumberChange(e, true)} className={inputClasses} placeholder="e.g. 70" data-error={!!errors.currentWeight} required />
                                                        {errors.currentWeight && <div className={errorClasses}>{errors.currentWeight}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Marital Status <span className="text-[#D23636] font-bold">*</span></label>
                                                        <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.maritalStatus} required>
                                                            <option value="">Select marital status</option>
                                                            <option value="Single">Single</option>
                                                            <option value="Married">Married</option>
                                                            <option value="Divorced">Divorced</option>
                                                            <option value="Widowed">Widowed</option>
                                                        </select>
                                                        {errors.maritalStatus && <div className={errorClasses}>{errors.maritalStatus}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Occupation <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="occupation" value={formData.occupation} onChange={handleChange} className={inputClasses} data-error={!!errors.occupation}  placeholder="Enter your occupation" required />
                                                        {errors.occupation && <div className={errorClasses}>{errors.occupation}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Contact Number <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="tel" name="contactNumber" value={formData.contactNumber} onChange={(e) => handleNumberChange(e, false, true)} className={inputClasses} data-error={!!errors.contactNumber} required />
                                                        {errors.contactNumber && <div className={errorClasses}>{errors.contactNumber}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>City <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClasses} data-error={!!errors.city}  placeholder="Enter your city" required />
                                                        {errors.city && <div className={errorClasses}>{errors.city}</div>}
                                                    </div>
                                                    <div className="w-full md:w-1/2 lg:w-1/3 px-[15px] mb-[28px]">
                                                        <label className={labelClasses}>Country <span className="text-[#D23636] font-bold">*</span></label>
                                                        <Select
                                                            options={countryOptions}
                                                            value={countryOptions.find(o => o.value === formData.country) || null}
                                                            onChange={handleCountryChange}
                                                            styles={reactSelectStyles(!!errors.country)}
                                                            placeholder="Select Country"
                                                        />
                                                        {errors.country && <div className={errorClasses}>{errors.country}</div>}
                                                    </div>
                                                </div>

                                                </div>
                                                
                                                <div className="section-card">
                                                {/* 2. Main Health Concern */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">2</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Main Health Concern</h2></div>
                                                <div className="row">
                                                    <div className="col-12 col-md-6 form-group-mb">
                                                        <label className={labelClasses}>What is your main health issue? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <select name="mainHealthIssue" value={formData.mainHealthIssue} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.mainHealthIssue} required>
                                                        <option value="">Select your main health issue</option>
                                                        <option value="Infertility">Infertility</option>
                                                        <option value="PCOS">PCOS</option>
                                                        <option value="Diabetes">Diabetes</option>
                                                        <option value="Obesity">Obesity</option>
                                                        <option value="Psoriasis">Psoriasis</option>
                                                        <option value="Thyroid">Thyroid</option>
                                                        <option value="TB">TB</option>
                                                        <option value="Other">Other</option>
                                                    </select>
                                                    {errors.mainHealthIssue && <div className={errorClasses}>{errors.mainHealthIssue}</div>}
                                                </div>
                                                
                                                    <div className="col-12 col-md-6 col-lg-6 form-group-mb">
                                                        <label className={labelClasses}>Since how many years are you facing this issue? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <input type="text" name="yearsFacingIssue" value={formData.yearsFacingIssue} onChange={handleChange} className={inputClasses} data-error={!!errors.yearsFacingIssue}  placeholder="e.g. 2" required />
                                                    {errors.yearsFacingIssue && <div className={errorClasses}>{errors.yearsFacingIssue}</div>}
                                                </div>
                                                
                                                    <div>
                                                    <div className="border border-[#d9d9d9] rounded-[10px] p-5 h-full">
                                                    <label className={labelClasses}>Have you taken medical treatment? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <div className="flex gap-8 mb-2">
                                                        <label className="radio-label">
                                                            <input type="radio" name="medicalTreatment" value="Yes" checked={formData.medicalTreatment === 'Yes'} onChange={handleChange} className="custom-radio-input" data-error={!!errors.medicalTreatment} required /> Yes
                                                        </label>
                                                        <label className="radio-label">
                                                            <input type="radio" name="medicalTreatment" value="No" checked={formData.medicalTreatment === 'No'} onChange={handleChange} className="custom-radio-input" required /> No
                                                        </label>
                                                    </div>
                                                    {errors.medicalTreatment && <div className={errorClasses}>{errors.medicalTreatment}</div>}
                                                    
                                                    {formData.medicalTreatment === 'Yes' && (
                                                        <div className="mt-2">
                                                            <label className={`${labelClasses} text-[0.875rem] text-[#6c757d]`}>If yes, mention treatment details <span className="text-[#D23636] font-bold">*</span></label>
                                                            <textarea name="treatmentDetails" value={formData.treatmentDetails} onChange={handleChange} className={inputClasses} rows={2} data-error={!!errors.treatmentDetails} required></textarea>
                                                            {errors.treatmentDetails && <div className={errorClasses}>{errors.treatmentDetails}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                                </div>
                                                    <div>
                                                    <div className="border border-[#d9d9d9] rounded-[10px] p-5 h-full">
                                                    <label className={labelClasses}>Are you currently taking any medicines? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <div className="flex gap-8 mb-2">
                                                        <label className="radio-label">
                                                            <input type="radio" name="takingMedicines" value="Yes" checked={formData.takingMedicines === 'Yes'} onChange={handleChange} className="custom-radio-input" data-error={!!errors.takingMedicines} required /> Yes
                                                        </label>
                                                        <label className="radio-label">
                                                            <input type="radio" name="takingMedicines" value="No" checked={formData.takingMedicines === 'No'} onChange={handleChange} className="custom-radio-input" required /> No
                                                        </label>
                                                    </div>
                                                    {errors.takingMedicines && <div className={errorClasses}>{errors.takingMedicines}</div>}
                                                    
                                                    {formData.takingMedicines === 'Yes' && (
                                                        <div className="mt-2">
                                                            <label className={`${labelClasses} text-[0.875rem] text-[#6c757d]`}>Please list the medicines <span className="text-[#D23636] font-bold">*</span></label>
                                                            <textarea name="currentMedicines" value={formData.currentMedicines} onChange={handleChange} className={inputClasses} rows={2} data-error={!!errors.currentMedicines} required></textarea>
                                                            {errors.currentMedicines && <div className={errorClasses}>{errors.currentMedicines}</div>}
                                                        </div>
                                                    )}
                                                </div>
                                                </div>
                                                    <div className="col-12 form-group-mb">
                                                        <label className={labelClasses}>Do you have any medical reports? (HbA1c, Thyroid, Hormone Tests, Scan Reports, etc.)</label>
                                                    <div className="mt-2 w-full border border-[#d9d9d9] rounded-[10px] p-6 flex flex-col md:flex-row items-center justify-between bg-white">
                                                        <div className="flex items-center mb-[28px] md:mb-0">
                                                            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mr-4">
                                                                <Upload className="w-6 h-6 text-gray-600" />
                                                            </div>
                                                            <div>
                                                                <h4 className="font-semibold text-gray-800 text-[15px] mb-1">Upload Files</h4>
                                                                <p className="text-gray-500 text-[13px]">Choose files or drag and drop</p>
                                                            </div>
                                                        </div>
                                                        <label className="inline-flex items-center px-6 py-[10px] bg-white border border-[#38996E] text-[#38996E] rounded-[6px] cursor-pointer hover:bg-[#F3FAEB] transition-all duration-300 font-medium text-[14px]">
                                                            Choose Files
                                                            <input 
                                                                type="file" 
                                                                multiple 
                                                                accept=".pdf,.jpg,.jpeg,.png" 
                                                                onChange={handleFileChange} 
                                                                className="hidden" 
                                                            />
                                                        </label>
                                                    </div>
                                                    {medicalReports.length > 0 && (
                                                        <div className="mt-2 text-sm text-gray-600">
                                                            {medicalReports.length} file(s) selected
                                                        </div>
                                                    )}
                                                </div>
                                                </div>

                                                </div>

                                                {(formData.mainHealthIssue === 'PCOS' || formData.mainHealthIssue.includes('PCOS')) && (
                                                    <div className="section-card">
                                                        {/* 3. For Infertility Clients */}
                                                        <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">*</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">For Infertility Clients (If Applicable)</h2></div>
                                                        <div className="col-12 col-md-6 form-group-mb">
                                                            <label className={labelClasses}>Is this consultation regarding infertility? <span className="text-[#D23636] font-bold">*</span></label>
                                                            <div className="radio-group-horiz">
                                                                <label className="radio-label">
                                                                    <input type="radio" name="seekingInfertilityConsultation" value="Yes" checked={formData.seekingInfertilityConsultation === 'Yes'} onChange={handleChange} className="custom-radio-input" data-error={!!errors.seekingInfertilityConsultation} required /> Yes
                                                                </label>
                                                                <label className="radio-label">
                                                                    <input type="radio" name="seekingInfertilityConsultation" value="No" checked={formData.seekingInfertilityConsultation === 'No'} onChange={handleChange} className="custom-radio-input" required /> No
                                                                </label>
                                                            </div>
                                                            {errors.seekingInfertilityConsultation && <div className={errorClasses}>{errors.seekingInfertilityConsultation}</div>}
                                                        </div>
                                                        
                                                        {formData.seekingInfertilityConsultation === 'Yes' && (
                                                            <div className="row">
                                                                <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Trying to conceive since how long?</label>
                                                                    <input type="text" name="tryingToConceiveSince" value={formData.tryingToConceiveSince} onChange={handleChange} className={inputClasses} />
                                                                </div>
                                                                <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Any history of miscarriage?</label>
                                                                    <input type="text" name="miscarriageHistory" value={formData.miscarriageHistory} onChange={handleChange} className={inputClasses} />
                                                                </div>
                                                                <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>IVF / IUI done before?</label>
                                                                    <input type="text" name="ivfIui" value={formData.ivfIui} onChange={handleChange} className={inputClasses} />
                                                                </div>
                                                                <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Menstrual cycle regular? (If female)</label>
                                                                    <input type="text" name="menstrualCycle" value={formData.menstrualCycle} onChange={handleChange} className={inputClasses} />
                                                                </div>
                                                                <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Diagnosed Conditions</label>
                                                                    <Select
                                                                        isMulti
                                                                        options={diagnosedOptions}
                                                                        value={diagnosedOptions.filter(opt => formData.diagnosedCondition.includes(opt.value))}
                                                                        onChange={handleDiagnosedConditionChange}
                                                                        styles={reactSelectStyles(false)}
                                                                        placeholder="Select conditions"
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                                <div className="section-card">
                                                {/* 6. Body Symptoms */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">3</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Symptoms <span className="text-gray-400 text-[14px] ml-2 font-normal">(Tick if applicable)</span></h2></div>
                                                <div className="row">
                                                    
<div className="row">
    <div className="col-12 col-md-6">
        <div className="symptoms-col">
            {symptomsList.slice(0, 5).map(sym => (
                <label key={sym.id} className="symptom-item">
                    <input type="checkbox" name="symptoms" value={sym.label} checked={formData.symptoms.includes(sym.label)} onChange={handleChange} className="custom-checkbox-input" data-error={!!errors.symptoms} />
                    <span className="text-gray-700 font-medium ml-3">{sym.label}</span>
                </label>
            ))}
        </div>
    </div>
    <div className="col-12 col-md-6 mt-3 mt-md-0">
        <div className="symptoms-col">
            {symptomsList.slice(5, 10).map(sym => (
                <label key={sym.id} className="symptom-item">
                    <input type="checkbox" name="symptoms" value={sym.label} checked={formData.symptoms.includes(sym.label)} onChange={handleChange} className="custom-checkbox-input" data-error={!!errors.symptoms} />
                    <span className="text-gray-700 font-medium ml-3">{sym.label}</span>
                </label>
            ))}
        </div>
    </div>
</div>
{errors.symptoms && <div className={errorClasses}>{errors.symptoms}</div>}

                                                </div>


                                                <div className="section-card">
                                                {/* 4. Lifestyle Details */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">4</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Additional Information</h2></div>
                                                <div className="row">
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Wake-up time <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="time" name="wakeUpTime" value={formData.wakeUpTime} onChange={handleChange} className={inputClasses} data-error={!!errors.wakeUpTime} required />
                                                        {errors.wakeUpTime && <div className={errorClasses}>{errors.wakeUpTime}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Sleep time <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="time" name="sleepTime" value={formData.sleepTime} onChange={handleChange} className={inputClasses} data-error={!!errors.sleepTime} required />
                                                        {errors.sleepTime && <div className={errorClasses}>{errors.sleepTime}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Exercise? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="exercise" value={formData.exercise} onChange={handleChange} className={inputClasses} placeholder="Select" data-error={!!errors.exercise} required />
                                                        {errors.exercise && <div className={errorClasses}>{errors.exercise}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Stress level <span className="text-[#D23636] font-bold">*</span></label>
                                                        <select name="stressLevel" value={formData.stressLevel} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.stressLevel} required>
                                                            <option value="">Select stress level</option>
                                                            <option value="Low">Low</option>
                                                            <option value="Moderate">Moderate</option>
                                                            <option value="High">High</option>
                                                        </select>
                                                        {errors.stressLevel && <div className={errorClasses}>{errors.stressLevel}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Water intake per day <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="waterIntake" value={formData.waterIntake} onChange={handleChange} className={inputClasses} data-error={!!errors.waterIntake}  placeholder="Select" required />
                                                        {errors.waterIntake && <div className={errorClasses}>{errors.waterIntake}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Bowel movement regular? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <select name="bowelMovement" value={formData.bowelMovement} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.bowelMovement} required>
                                                            <option value="">Select</option>
                                                            <option value="Yes">Yes</option>
                                                            <option value="No">No</option>
                                                        </select>
                                                        {errors.bowelMovement && <div className={errorClasses}>{errors.bowelMovement}</div>}
                                                    </div>
                                                </div>

                                                
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Vegetarian / Non-vegetarian? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <select name="foodPreference" value={formData.foodPreference} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.foodPreference} required>
                                                            <option value="">Select food preference</option>
                                                            <option value="Vegetarian">Vegetarian</option>
                                                            <option value="Non-Vegetarian">Non-Vegetarian</option>
                                                            <option value="Vegan">Vegan</option>
                                                        </select>
                                                        {errors.foodPreference && <div className={errorClasses}>{errors.foodPreference}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Tea/Coffee per day? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="teaCoffee" value={formData.teaCoffee} onChange={handleChange} className={inputClasses} data-error={!!errors.teaCoffee}  placeholder="Select" required />
                                                        {errors.teaCoffee && <div className={errorClasses}>{errors.teaCoffee}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Sugar consumption? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="sugar" value={formData.sugar} onChange={handleChange} className={inputClasses} data-error={!!errors.sugar}  placeholder="Select" required />
                                                        {errors.sugar && <div className={errorClasses}>{errors.sugar}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Outside food frequency? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="outsideFood" value={formData.outsideFood} onChange={handleChange} className={inputClasses} data-error={!!errors.outsideFood}  placeholder="Select" required />
                                                        {errors.outsideFood && <div className={errorClasses}>{errors.outsideFood}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Rice/Wheat consumption daily? <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input type="text" name="riceWheat" value={formData.riceWheat} onChange={handleChange} className={inputClasses} data-error={!!errors.riceWheat}  placeholder="Select" required />
                                                        {errors.riceWheat && <div className={errorClasses}>{errors.riceWheat}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Any food allergies?</label>
                                                        <input type="text" name="foodAllergies" value={formData.foodAllergies} onChange={handleChange} className={inputClasses}  placeholder="Enter details" />
                                                    </div>
                                                </div>

                                                </div>
                                                <div className="section-card">
                                                {/* 8. Appointment Details */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">5</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Appointment Preferences</h2></div>
                                                <div className="row">
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Assessment Date <span className="text-[#D23636] font-bold">*</span></label>
                                                        <input 
                                                            type="date" name="appointmentDate" value={formData.appointmentDate} onChange={handleChange}
                                                            min={new Date().toLocaleDateString('en-CA')}
                                                            className={inputClasses}
                                                            data-error={!!errors.appointmentDate}
                                                            required
                                                        />
                                                        {errors.appointmentDate && <div className={errorClasses}>{errors.appointmentDate}</div>}
                                                    </div>
                                                    <div className="col-12 col-md-6 col-lg-4 form-group-mb">
                                                        <label className={labelClasses}>Available Time Slots <span className="text-[#D23636] font-bold">*</span></label>
                                                        {!formData.appointmentDate ? (
                                                            <div className={`${inputClasses} bg-[#f8f9fa] text-center text-[#6c757d]`}>Select date first</div>
                                                        ) : fetchingSlots ? (
                                                            <div className={`${inputClasses} flex justify-center`}><Loader2 className="animate-spin text-[#38996E]" /></div>
                                                        ) : availableSlots.length === 0 ? (
                                                            <div className={`${inputClasses} bg-[#f8d7da] text-[#842029] border-[#f5c2c7] d-flex align-items-center justify-content-center`} style={{ whiteSpace: 'pre-line' }}>{slotMessage}</div>
                                                        ) : (
                                                            <select name="appointmentTime" value={formData.appointmentTime} onChange={handleChange} className={`${selectClasses} custom-select-bg`} data-error={!!errors.appointmentTime} required>
                                                                <option value="">Select time slot</option>
                                                                {availableSlots.map(slot => (
                                                                    <option key={slot} value={slot}>{slot}</option>
                                                                ))}
                                                            </select>
                                                        )}
                                                        {errors.appointmentTime && <div className={errorClasses}>{errors.appointmentTime}</div>}
                                                    </div>
                                                </div>

                                                </div>
                                               

                                                <div className="text-center mt-10">
                                                </div>
                                                <div className="section-card">
                                                {/* 7. Commitment Level */}
                                                <div className="flex items-center mb-[28px]"><div className="w-8 h-8 rounded-[8px] bg-[#E8F5E9] text-[#2B7A58] flex items-center justify-center font-bold mr-3 text-[15px]">6</div><h2 className="text-[18px] md:text-[20px] font-bold text-gray-800">Commitment</h2></div>
                                                <div className="row">
                                                    <div className="col-12 col-md-4 form-group-mb" data-error={!!errors.readyForNaturalDiet}>
                                                    <label className={labelClasses}>Are you ready to follow a natural diet? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <div className="radio-group-horiz">
                                                        <label className="radio-label">
                                                            <input type="radio" name="readyForNaturalDiet" value="Yes" checked={formData.readyForNaturalDiet === 'Yes'} onChange={handleChange} className="custom-radio-input" required /> Yes
                                                        </label>
                                                        <label className="radio-label">
                                                            <input type="radio" name="readyForNaturalDiet" value="No" checked={formData.readyForNaturalDiet === 'No'} onChange={handleChange} className="custom-radio-input" required /> No
                                                        </label>
                                                    </div>
                                                    {errors.readyForNaturalDiet && <div className={errorClasses}>{errors.readyForNaturalDiet}</div>}
                                                </div>
                                                <div className="col-12 col-md-4 form-group-mb" data-error={!!errors.readyToAvoidSugar}>
                                                    <label className={labelClasses} style={{ minHeight: "47px" }}>Are you willing to avoid sugar? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <div className="radio-group-horiz">
                                                        <label className="radio-label">
                                                            <input type="radio" name="readyToAvoidSugar" value="Yes" checked={formData.readyToAvoidSugar === 'Yes'} onChange={handleChange} className="custom-radio-input" required /> Yes
                                                        </label>
                                                        <label className="radio-label">
                                                            <input type="radio" name="readyToAvoidSugar" value="No" checked={formData.readyToAvoidSugar === 'No'} onChange={handleChange} className="custom-radio-input" required /> No
                                                        </label>
                                                    </div>
                                                    {errors.readyToAvoidSugar && <div className={errorClasses}>{errors.readyToAvoidSugar}</div>}
                                                </div>
                                                <div className="col-12 col-md-4 form-group-mb" data-error={!!errors.familySupport}>
                                                    <label className={labelClasses}>Does your family support this lifestyle? <span className="text-[#D23636] font-bold">*</span></label>
                                                    <div className="radio-group-horiz">
                                                        <label className="radio-label">
                                                            <input type="radio" name="familySupport" value="Yes" checked={formData.familySupport === 'Yes'} onChange={handleChange} className="custom-radio-input" required /> Yes
                                                        </label>
                                                        <label className="radio-label">
                                                            <input type="radio" name="familySupport" value="No" checked={formData.familySupport === 'No'} onChange={handleChange} className="custom-radio-input" required /> No
                                                        </label>
                                                    </div>
                                                    {errors.familySupport && <div className={errorClasses}>{errors.familySupport}</div>}
                                                </div>
                                                 {/* Important Note */}
                                                <div className="relative p-4 mb-[28px] text-[#664d03] bg-[#fff3cd] border border-[#ffecb5] rounded-[0.375rem]">
                                                    <strong>🌿 Important Note:</strong> I am not a medical doctor. I am a natural healing practitioner with 18 years of experience. My diet guidance is based on food correction and natural body healing principles. This is not a replacement for medical treatment.
                                                </div>
                                                </div>
                                                </div>

                                                    <button type="submit" disabled={loading} className="w-full inline-flex justify-center items-center px-10 py-[16px] text-[16px] text-white bg-[#2B7A58] rounded-[8px] hover:bg-[#215E44] shadow-md font-bold transition-all duration-300 cursor-pointer border-0 btnconsult">
                                                        {loading ? <Loader2 className="animate-spin inline mr-2 w-5 h-5" /> : <Send className="w-5 h-5 mr-2" />}
                                                        Submit Registration
                                                    </button>
                                            </form>
                                        </>
                                    ) : (
                                        <div id="paymentSection" className="text-center">
                                            <h4 className="text-[#198754] text-[1.5rem] mb-[28px] font-normal">
                                                <AlertCircle className="inline w-6 h-6 mr-2" /> Registration Submitted Successfully!
                                            </h4>
                                            
                                            {fetchingPayment ? (
                                                <div className="py-8">
                                                    <Loader2 className="animate-spin w-8 h-8 text-[#198754] mx-auto mb-4" />
                                                    <p className="text-gray-500">Loading payment details...</p>
                                                </div>
                                            ) : paymentSettings && (paymentSettings.qrCodeImage || paymentSettings.upiId) ? (
                                                <>
                                                    <p className="mb-[28px]">Please scan the QR code below to complete your payment via UPI to book the consultation.</p>
                                                    
                                                    {paymentSettings.qrCodeImage && (
                                                        <div className="my-6 flex justify-center">
                                                            <img src={paymentSettings.qrCodeImage} alt="UPI Payment QR Code" className="max-w-full h-auto border p-2 bg-white shadow-sm rounded-lg" style={{maxWidth: '250px'}} />
                                                        </div>
                                                    )}
                                                    
                                                    <div className="bg-[#f8f9fa] p-4 rounded-lg inline-block mx-auto mb-[28px] border">
                                                        {paymentSettings.upiId && <p className="text-[#212529] mb-2 text-lg">UPI ID: <strong>{paymentSettings.upiId}</strong></p>}
                                                        {paymentSettings.phoneNumber && <p className="text-[#6c757d] mb-0">Phone: {paymentSettings.phoneNumber}</p>}
                                                    </div>
                                                    
                                                    <p className="mb-[28px] font-medium text-[#2B7A58]">After payment, you will be contacted shortly with your consultation details.</p>
                                                </>
                                            ) : (
                                                <div className="bg-[#f8f9fa] p-6 rounded-lg mx-auto mb-[28px] border max-w-md">
                                                    <AlertCircle className="w-10 h-10 text-[#6c757d] mx-auto mb-3" />
                                                    <h4 className="text-[#212529] font-bold text-lg mb-2">Payment Method Unavailable</h4>
                                                    <p className="text-[#6c757d] mb-0 font-medium">No payment method is currently available.</p>
                                                    <p className="text-[#6c757d] mt-1 text-sm">Please contact the administrator.</p>
                                                </div>
                                            )}

                                            <button onClick={() => navigate('/')} className="inline-block mt-4 px-8 py-2 text-[1rem] text-white bg-[#38996E] rounded-[0.375rem] hover:bg-[#2d7a58] transition-colors cursor-pointer border-0 shadow-sm">
                                                Return to Dashboard
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConsultationBooking;
