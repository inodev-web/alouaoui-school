import api from './axios.config';

class AuthService {
    constructor() {
        this.updateStoredUserStructure();
    }

    async login(phone, password, options = {}) {
        try {
            // Éviter les appels de login multiples
            if (this.isLoggingIn) {
                throw new Error('Une connexion est déjà en cours...');
            }
            this.isLoggingIn = true;

            // Utiliser / persister un device_uuid pour cohérence avec le backend
            let deviceUuid = localStorage.getItem('device_uuid');
            if (!deviceUuid) {
                deviceUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('device_uuid', deviceUuid);
            }

            const payload = {
                login: phone,          // le backend attend 'login'
                password,
                device_uuid: deviceUuid,
                single_device: options.single_device ?? true
            };

            const response = await api.post('/auth/login', payload);
            const serverData = response.data.data;
            console.log('Server login response:', serverData);

            if (!serverData || !serverData.token) {
                throw new Error('لم يتم استلام رمز المصادقة من الخادم');
            }

            localStorage.setItem('token', serverData.token);
            if (serverData.device_uuid) {
                localStorage.setItem('device_uuid', serverData.device_uuid);
            }

            // Normalisation de l'objet user
            const rawUser = serverData.user ? serverData.user : serverData;
            const finalUser = {
                id: rawUser.uuid || rawUser.id, // conserver compatibilité interne si l'app attend id
                uuid: rawUser.uuid || rawUser.id,
                firstname: rawUser.firstname || '',
                lastname: rawUser.lastname || '',
                phone: rawUser.phone || phone,
                role: rawUser.role || 'student',
                year_of_study: rawUser.year_of_study || '',
                qr_token: rawUser.qr_token || rawUser.uuid || rawUser.id || '' // alias vers uuid
            };

            // Tentative d'enrichissement via /auth/profile (optionnel)
            // Skip pour les admins qui ont déjà toutes les infos nécessaires
            if (finalUser.role !== 'admin') {
                try {
                    const profile = await this.getProfile();
                    if (profile) {
                        Object.assign(finalUser, profile);
                        // S'assurer que uuid reste cohérent
                        finalUser.uuid = profile.uuid || finalUser.uuid;
                        finalUser.id = finalUser.uuid; // aligner id sur uuid pour éviter confusion
                        finalUser.qr_token = finalUser.uuid;
                    }
                } catch (e) {
                    console.warn('getProfile after login failed, using partial user data', e);
                }
            } else {
                console.log('Admin login - skipping profile fetch, using login data');
            }

            localStorage.setItem('user', JSON.stringify(finalUser));

            return { token: serverData.token, user: finalUser };
        } catch (error) {
            console.error('Auth service login error:', error);
            throw this.handleError(error);
        } finally {
            this.isLoggingIn = false;
        }
    }

    // No client-side QR computation. Use server-provided `qr_token`.

    async register(userData) {
        try {
            // Champs requis côté backend
            const requiredFields = ['firstname', 'lastname', 'phone', 'password', 'year_of_study', 'birth_date', 'address', 'school_name'];
            for (const field of requiredFields) {
                if (!userData[field]) {
                    throw new Error(`Le champ ${field} est requis`);
                }
            }

            // Générer un device_uuid si absent (cohérent avec login)
            let deviceUuid = localStorage.getItem('device_uuid');
            if (!deviceUuid) {
                deviceUuid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'dev-' + Math.random().toString(36).substring(2, 15);
                localStorage.setItem('device_uuid', deviceUuid);
            }

            const payload = { ...userData, password_confirmation: userData.password_confirmation || userData.password, device_uuid: deviceUuid };

            const response = await api.post('/auth/register', payload);
            const serverData = response.data.data;

            if (!serverData || !serverData.token) {
                throw new Error('لم يتم استلام رمز المصادقة من الخادم');
            }

            localStorage.setItem('token', serverData.token);
            if (serverData.device_uuid) {
                localStorage.setItem('device_uuid', serverData.device_uuid);
            }

            const rawUser = serverData.user ? serverData.user : serverData;
            const formattedUser = {
                id: rawUser.uuid || rawUser.id,
                uuid: rawUser.uuid || rawUser.id,
                firstname: rawUser.firstname || userData.firstname,
                lastname: rawUser.lastname || userData.lastname,
                phone: rawUser.phone || userData.phone,
                role: rawUser.role || 'student',
                year_of_study: rawUser.year_of_study || userData.year_of_study,
                qr_token: rawUser.qr_token || rawUser.uuid || rawUser.id || ''
            };
            formattedUser.qr_token = formattedUser.uuid;

            localStorage.setItem('user', JSON.stringify(formattedUser));

            return { token: serverData.token, user: formattedUser };
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async sendVerificationCode(phone) {
        try {
            const response = await api.post('/auth/send-verification-code', { phone });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async verifyCode(phone, code) {
        try {
            const response = await api.post('/auth/verify-code', { phone, code });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async logout() {
        try {
            await api.post('/auth/logout');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('device_uuid');
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async getProfile() {
        try {
            const response = await api.get('/auth/profile');
            const profileData = response.data.data;
            if (profileData) {
                const formattedProfile = {
                    id: profileData.uuid || profileData.id,
                    uuid: profileData.uuid || profileData.id,
                    firstname: profileData.firstname || '',
                    lastname: profileData.lastname || '',
                    phone: profileData.phone || '',
                    role: profileData.role || 'student',
                    year_of_study: profileData.year_of_study || '',
                    qr_token: profileData.qr_token || profileData.uuid || profileData.id || ''
                };
                formattedProfile.qr_token = formattedProfile.uuid;
                localStorage.setItem('user', JSON.stringify(formattedProfile));
                return formattedProfile;
            }
            return null;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await api.put('/auth/profile', profileData);
            const updatedProfile = response.data.data;
            if (updatedProfile) {
                const formattedProfile = {
                    id: updatedProfile.uuid || updatedProfile.id,
                    uuid: updatedProfile.uuid || updatedProfile.id,
                    firstname: updatedProfile.firstname || '',
                    lastname: updatedProfile.lastname || '',
                    phone: updatedProfile.phone || '',
                    role: updatedProfile.role || 'student',
                    year_of_study: updatedProfile.year_of_study || '',
                    qr_token: updatedProfile.qr_token || updatedProfile.uuid || updatedProfile.id || ''
                };
                formattedProfile.qr_token = formattedProfile.uuid;
                localStorage.setItem('user', JSON.stringify(formattedProfile));
                return formattedProfile;
            }
            return null;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async changePassword(passwordData) {
        try {
            const response = await api.put('/auth/change-password', {
                current_password: passwordData.current_password,
                password: passwordData.password,
                password_confirmation: passwordData.password_confirmation
            });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    isLoggedIn() {
        return !!localStorage.getItem('token');
    }

    getCurrentUser() {
        const userStr = localStorage.getItem('user');
        if (!userStr) return null;

        try {
            return JSON.parse(userStr);
        } catch (error) {
            console.error('Error parsing user data:', error);
            return null;
        }
    }

    updateStoredUserStructure() {
        try {
            const userStr = localStorage.getItem('user');
            if (!userStr) return;

            const user = JSON.parse(userStr);
            
            // Ne mettre à jour que si l'ancienne structure est détectée
            if (user.name !== undefined || user.email !== undefined || !user.uuid) {
                const uuid = user.uuid || user.id || (user.qr_token) || 'missing-uuid';
                const updatedUser = {
                    id: uuid,
                    uuid,
                    firstname: user.firstname || '',
                    lastname: user.lastname || '',
                    phone: user.phone || '',
                    role: user.role || 'student',
                    year_of_study: user.year_of_study || '',
                    qr_token: uuid
                };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('User data structure updated (uuid normalized):', updatedUser);
            }
        } catch (error) {
            console.error('Error updating user structure:', error);
        }
    }

    handleError(error) {
        if (error.response) {
            let message = error.response.data.message || 'Une erreur est survenue';
            
            // Traduire les messages d'erreur en arabe
            message = this.translateErrorMessage(message);
            
            if (error.response.status === 422 && error.response.data.errors) {
                // Traduire aussi les erreurs de validation
                const translatedErrors = {};
                Object.keys(error.response.data.errors).forEach(field => {
                    const fieldErrors = error.response.data.errors[field];
                    translatedErrors[field] = Array.isArray(fieldErrors) 
                        ? fieldErrors.map(err => this.translateErrorMessage(err))
                        : [this.translateErrorMessage(fieldErrors)];
                });
                
                const err = new Error(message);
                err.response = {
                    ...error.response,
                    data: {
                        ...error.response.data,
                        errors: translatedErrors
                    }
                };
                return err;
            }

            const err = new Error(message);
            err.response = error.response;
            return err;
        }
        return error;
    }

    translateErrorMessage(message) {
        const translations = {
            // Messages d'authentification
            'The provided credentials are incorrect.': 'البيانات المدخلة غير صحيحة',
            'Validation failed': 'فشل في التحقق من البيانات',
            'Une erreur est survenue': 'حدث خطأ',
            
            // Erreurs de champs
            'The login field is required.': 'حقل الهاتف مطلوب',
            'The password field is required.': 'حقل كلمة المرور مطلوب',
            'The phone field is required.': 'رقم الهاتف مطلوب',
            'The firstname field is required.': 'الاسم الأول مطلوب',
            'The lastname field is required.': 'اسم العائلة مطلوب',
            'The password confirmation does not match.': 'تأكيد كلمة المرور غير متطابق',
            'The phone has already been taken.': 'رقم الهاتف مستخدم من قبل',
            
            // Messages généraux
            'Non authentifié': 'غير مسجل الدخول',
            'Unauthorized': 'غير مخول',
            'Forbidden': 'ممنوع الوصول',
            'Not Found': 'غير موجود',
            
            // Messages de device
            'Device restriction violation': 'انتهاك قيود الجهاز',
            'Single device login required': 'تسجيل الدخول من جهاز واحد فقط',
            
            // Messages d'abonnement
            'Active subscription required': 'اشتراك نشط مطلوب',
            'Access denied': 'تم رفض الوصول'
        };

        return translations[message] || message;
    }
}

export default new AuthService();