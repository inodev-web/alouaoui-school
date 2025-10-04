import api from './axios.config';

class AuthService {
    constructor() {
        this.updateStoredUserStructure();
    }

    async login(phone, password) {
        try {
            const response = await api.post('/auth/login', {
                phone,
                password
            });

            const serverData = response.data.data;
            console.log('Server login response:', serverData);

            if (!serverData || !serverData.token) {
                throw new Error('لم يتم استلام رمز المصادقة من الخادم');
            }

            // Stocker les données essentielles
            localStorage.setItem('token', serverData.token);
            localStorage.setItem('device_uuid', serverData.device_uuid);

            // Après avoir stocké le token, utiliser les données retournées par la route /auth/login
            // Certains endpoints renvoient { user: {...}, token, device_uuid }
            let finalUser = {};
            if (serverData.user) {
                // Le serveur a retourné un objet user directement
                const u = serverData.user;
                finalUser = {
                    id: u.id,
                    firstname: u.firstname || '',
                    lastname: u.lastname || '',
                    phone: u.phone || phone,
                    role: u.role || 'student',
                    year_of_study: u.year_of_study || '',
                    qr_token: u.qr_token || ''
                };
            } else {
                // Structure alternative où les champs sont à la racine
                finalUser = {
                    id: serverData.id,
                    firstname: serverData.firstname || '',
                    lastname: serverData.lastname || '',
                    phone: serverData.phone || phone,
                    role: serverData.role || 'student',
                    year_of_study: serverData.year_of_study || '',
                    qr_token: serverData.qr_token || ''
                };
            }

            try {
                // getProfile utilise l'Authorization header via axios interceptors
                const profile = await this.getProfile();
                if (profile) {
                    // Fusionner les données du profile (priorité au profile serveur)
                    finalUser = {
                        ...finalUser,
                        ...profile
                    };
                }
            } catch (e) {
                // Si getProfile échoue, on garde finalUser tel quel
                console.warn('getProfile after login failed, using partial user data', e);
            }

            // Prefer server-provided qr_token; default to empty string if absent
            finalUser.qr_token = finalUser.qr_token || '';

            localStorage.setItem('user', JSON.stringify(finalUser));

            return {
                token: serverData.token,
                user: finalUser
            };
        } catch (error) {
            console.error('Auth service login error:', error);
            throw this.handleError(error);
        }
    }

    // No client-side QR computation. Use server-provided `qr_token`.

    async register(userData) {
        try {
            const requiredFields = ['firstname', 'lastname', 'phone', 'password', 'year_of_study'];
            for (const field of requiredFields) {
                if (!userData[field]) {
                    throw new Error(`Le champ ${field} est requis`);
                }
            }

            const response = await api.post('/auth/register', userData);
            const serverData = response.data.data;

            if (!serverData || !serverData.token) {
                throw new Error('لم يتم استلام رمز المصادقة من الخادم');
            }

            // Stocker les données essentielles
            localStorage.setItem('token', serverData.token);
            localStorage.setItem('device_uuid', serverData.device_uuid);

            // Formater les données utilisateur
            const formattedUser = {
                id: serverData.id,
                firstname: serverData.firstname || '',
                lastname: serverData.lastname || '',
                phone: serverData.phone || userData.phone,
                role: serverData.role || 'student',
                year_of_study: serverData.year_of_study || userData.year_of_study,
                qr_token: serverData.qr_token || ''
            };

            formattedUser.qr_token = formattedUser.qr_token || '';

            localStorage.setItem('user', JSON.stringify(formattedUser));

            return {
                token: serverData.token,
                user: formattedUser
            };
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
            console.log('Raw getProfile response:', response);
            const profileData = response.data.data;

            // Mise à jour du localStorage avec les données les plus récentes
            if (profileData) {
                const formattedProfile = {
                    id: profileData.id,
                    firstname: profileData.firstname || '',
                    lastname: profileData.lastname || '',
                    phone: profileData.phone || '',
                    role: profileData.role || 'student',
                    year_of_study: profileData.year_of_study || '',
                    qr_token: profileData.qr_token || ''
                };
                formattedProfile.qr_token = formattedProfile.qr_token || '';
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
                    id: updatedProfile.id,
                    firstname: updatedProfile.firstname || '',
                    lastname: updatedProfile.lastname || '',
                    phone: updatedProfile.phone || '',
                    role: updatedProfile.role || 'student',
                    year_of_study: updatedProfile.year_of_study || '',
                    qr_token: updatedProfile.qr_token || ''
                };
                formattedProfile.qr_token = formattedProfile.qr_token || '';
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
            if (user.name !== undefined || user.email !== undefined) {
                const updatedUser = {
                    id: user.id,
                    firstname: user.firstname || '',
                    lastname: user.lastname || '',
                    phone: user.phone || '',
                    role: user.role || 'student',
                    year_of_study: user.year_of_study || '',
                    qr_token: user.qr_token || ''
                };

                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('User data structure updated:', updatedUser);
            }
        } catch (error) {
            console.error('Error updating user structure:', error);
        }
    }

    handleError(error) {
        if (error.response) {
            const message = error.response.data.message || 'Une erreur est survenue';
            
            if (error.response.status === 422 && error.response.data.errors) {
                return new Error('بيانات غير صالحة');
            }

            return new Error(message);
        }
        return error;
    }
}

export default new AuthService();