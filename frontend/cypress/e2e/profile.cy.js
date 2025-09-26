describe('Profile Management E2E Tests', () => {
  let authToken;

  beforeEach(() => {
    // Intercepter les appels API de profil
    cy.intercept('GET', '**/api/profile', { fixture: 'student-profile.json' }).as('getProfile');
    cy.intercept('PUT', '**/api/profile', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Profil mis à jour avec succès',
        data: { fixture: 'student-profile.json' }
      }
    }).as('updateProfile');
    cy.intercept('POST', '**/api/profile/avatar', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          profile_picture: '/images/profiles/new-avatar.jpg'
        }
      }
    }).as('uploadAvatar');
    cy.intercept('POST', '**/api/change-password', {
      statusCode: 200,
      body: {
        success: true,
        message: 'Mot de passe modifié avec succès'
      }
    }).as('changePassword');

    // Se connecter en tant qu'étudiant
    cy.loginAsStudent();
  });

  describe('Consultation du profil', () => {
    it('devrait afficher les informations du profil étudiant', () => {
      cy.visit('/student/profile');
      
      cy.wait('@getProfile');

      // Vérifier les informations personnelles
      cy.contains('Jean Dupont').should('be.visible');
      cy.contains('jean.dupont@example.com').should('be.visible');
      cy.contains('06 12 34 56 78').should('be.visible');
      cy.contains('Lycée Al-Khawarizmi').should('be.visible');
      cy.contains('Terminale S').should('be.visible');

      // Vérifier l'avatar
      cy.get('[data-testid="profile-picture"]')
        .should('be.visible')
        .and('have.attr', 'src')
        .and('include', 'student-avatar.jpg');

      // Vérifier le statut d'abonnement
      cy.get('[data-testid="subscription-status"]').should('contain', 'Premium');
      cy.get('[data-testid="subscription-badge"]').should('have.class', 'active');

      // Vérifier les informations académiques
      cy.contains('Sciences Mathématiques').should('be.visible');
      cy.contains('Baccalauréat 2025').should('be.visible');
      cy.contains('Avancé').should('be.visible');
    });

    it('devrait afficher les statistiques de progression', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet progression
      cy.get('[data-testid="progress-tab"]').click();

      // Vérifier les statistiques
      cy.get('[data-testid="completed-chapters"]').should('contain', '24');
      cy.get('[data-testid="total-chapters"]').should('contain', '36');
      cy.get('[data-testid="completion-percentage"]').should('contain', '67%');
      cy.get('[data-testid="average-score"]').should('contain', '16.5');
      cy.get('[data-testid="streak-days"]').should('contain', '12');
      cy.get('[data-testid="study-hours"]').should('contain', '180');

      // Vérifier les badges
      cy.get('[data-testid="badges-container"]').within(() => {
        cy.contains('Assidu').should('be.visible');
        cy.contains('Perfectionniste').should('be.visible');
        cy.contains('Rapide').should('be.visible');
      });

      // Vérifier le graphique de progression
      cy.get('[data-testid="progress-chart"]').should('be.visible');
    });

    it('devrait afficher l\'activité récente', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet activité
      cy.get('[data-testid="activity-tab"]').click();

      // Vérifier les activités récentes
      cy.get('[data-testid="activity-list"]').within(() => {
        cy.contains('Exercice: Dérivées et primitives').should('be.visible');
        cy.contains('Score: 18').should('be.visible');
        cy.contains('Session Live: Préparation Bac Blanc').should('be.visible');
        cy.contains('Durée: 90 min').should('be.visible');
        cy.contains('Chapitre 12: Fonctions logarithmes').should('be.visible');
        cy.contains('Progrès: 100%').should('be.visible');
      });

      // Vérifier les dates d'activité
      cy.get('[data-testid="activity-item"]').should('have.length', 3);
      cy.get('[data-testid="activity-date"]').first().should('contain', '20 janvier');
    });
  });

  describe('Modification du profil', () => {
    it('devrait permettre de modifier les informations personnelles', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Cliquer sur le bouton d'édition
      cy.get('[data-testid="edit-profile-btn"]').click();

      // Vérifier que le mode édition est activé
      cy.get('[data-testid="profile-form"]').should('be.visible');

      // Modifier les informations
      cy.get('[data-testid="name-input"]').should('have.value', 'Jean Dupont');
      cy.get('[data-testid="name-input"]').clear().type('Jean-Pierre Dupont');

      cy.get('[data-testid="phone-input"]').should('have.value', '06 12 34 56 78');
      cy.get('[data-testid="phone-input"]').clear().type('06 98 76 54 32');

      cy.get('[data-testid="school-input"]').should('have.value', 'Lycée Al-Khawarizmi');
      cy.get('[data-testid="school-input"]').clear().type('Lycée Ibn Sina');

      // Sauvegarder les modifications
      cy.get('[data-testid="save-profile-btn"]').click();

      cy.wait('@updateProfile');

      // Vérifier la confirmation
      cy.contains('Profil mis à jour avec succès').should('be.visible');
      
      // Vérifier que le mode édition est désactivé
      cy.get('[data-testid="profile-form"]').should('not.exist');
    });

    it('devrait permettre de modifier les préférences', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet paramètres
      cy.get('[data-testid="settings-tab"]').click();

      // Modifier les notifications
      cy.get('[data-testid="email-notifications"]').should('be.checked');
      cy.get('[data-testid="sms-notifications"]').should('not.be.checked');
      cy.get('[data-testid="push-notifications"]').should('be.checked');

      // Changer les paramètres de notification
      cy.get('[data-testid="sms-notifications"]').check();
      cy.get('[data-testid="marketing-notifications"]').should('not.be.checked');

      // Modifier les préférences d'étude
      cy.get('[data-testid="study-reminders"]').should('be.checked');
      cy.get('[data-testid="progress-reports"]').select('daily');

      // Modifier le thème
      cy.get('[data-testid="theme-selector"]').select('dark');

      // Sauvegarder les paramètres
      cy.get('[data-testid="save-settings-btn"]').click();

      cy.wait('@updateProfile');

      // Vérifier la confirmation
      cy.contains('Paramètres mis à jour avec succès').should('be.visible');
    });

    it('devrait permettre de changer l\'avatar', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Cliquer sur l'avatar pour le changer
      cy.get('[data-testid="avatar-upload-btn"]').click();

      // Simuler l'upload d'une image
      const fileName = 'new-avatar.jpg';
      cy.fixture(fileName).then(fileContent => {
        cy.get('[data-testid="avatar-input"]').attachFile({
          fileContent: fileContent.toString(),
          fileName: fileName,
          mimeType: 'image/jpeg'
        });
      });

      cy.wait('@uploadAvatar');

      // Vérifier la confirmation
      cy.contains('Avatar mis à jour avec succès').should('be.visible');

      // Vérifier que l'avatar a changé
      cy.get('[data-testid="profile-picture"]')
        .should('have.attr', 'src')
        .and('include', 'new-avatar.jpg');
    });
  });

  describe('Sécurité du profil', () => {
    it('devrait permettre de changer le mot de passe', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet sécurité
      cy.get('[data-testid="security-tab"]').click();

      // Cliquer sur changer le mot de passe
      cy.get('[data-testid="change-password-btn"]').click();

      // Vérifier que le formulaire s'ouvre
      cy.get('[data-testid="password-form"]').should('be.visible');

      // Remplir le formulaire
      cy.get('[data-testid="current-password"]').type('ancienMotDePasse123');
      cy.get('[data-testid="new-password"]').type('nouveauMotDePasse456!');
      cy.get('[data-testid="confirm-password"]').type('nouveauMotDePasse456!');

      // Soumettre le formulaire
      cy.get('[data-testid="submit-password-change"]').click();

      cy.wait('@changePassword');

      // Vérifier la confirmation
      cy.contains('Mot de passe modifié avec succès').should('be.visible');
      cy.get('[data-testid="password-form"]').should('not.exist');
    });

    it('devrait afficher les paramètres de sécurité', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet sécurité
      cy.get('[data-testid="security-tab"]').click();

      // Vérifier les informations de sécurité
      cy.contains('Authentification à deux facteurs').should('be.visible');
      cy.get('[data-testid="two-factor-status"]').should('contain', 'Désactivée');
      cy.get('[data-testid="enable-2fa-btn"]').should('be.visible');

      cy.contains('Notifications de connexion').should('be.visible');
      cy.get('[data-testid="login-notifications"]').should('be.checked');

      cy.contains('Dernière modification du mot de passe').should('be.visible');
      cy.get('[data-testid="password-last-changed"]').should('contain', '15 décembre 2024');
    });

    it('devrait permettre de gérer la confidentialité', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet confidentialité
      cy.get('[data-testid="privacy-tab"]').click();

      // Vérifier les paramètres de confidentialité
      cy.get('[data-testid="profile-visibility"]').should('have.value', 'friends');
      cy.get('[data-testid="show-progress"]').should('be.checked');
      cy.get('[data-testid="show-achievements"]').should('be.checked');

      // Modifier les paramètres
      cy.get('[data-testid="profile-visibility"]').select('private');
      cy.get('[data-testid="show-progress"]').uncheck();

      // Sauvegarder
      cy.get('[data-testid="save-privacy-btn"]').click();

      cy.wait('@updateProfile');

      // Vérifier la confirmation
      cy.contains('Paramètres de confidentialité mis à jour').should('be.visible');
    });
  });

  describe('Gestion des données', () => {
    it('devrait permettre de télécharger ses données', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet données
      cy.get('[data-testid="data-tab"]').click();

      // Intercepter la demande de téléchargement
      cy.intercept('GET', '**/api/profile/export', {
        statusCode: 200,
        body: { download_url: '/downloads/user-data.zip' }
      }).as('exportData');

      // Cliquer sur télécharger les données
      cy.get('[data-testid="download-data-btn"]').click();

      cy.wait('@exportData');

      // Vérifier la confirmation
      cy.contains('Vos données sont en cours de préparation').should('be.visible');
    });

    it('devrait afficher les options de suppression de compte', () => {
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Naviguer vers l'onglet données
      cy.get('[data-testid="data-tab"]').click();

      // Vérifier l'option de suppression
      cy.contains('Supprimer mon compte').should('be.visible');
      cy.get('[data-testid="delete-account-btn"]').should('be.visible');
      cy.contains('Cette action est irréversible').should('be.visible');

      // Vérifier les options de rétention
      cy.get('[data-testid="data-retention"]').should('have.value', 'keep_forever');
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de chargement du profil', () => {
      // Simuler une erreur API
      cy.intercept('GET', '**/api/profile', {
        statusCode: 500,
        body: { error: 'Erreur serveur' }
      }).as('failedProfile');

      cy.loginAsStudent();
      cy.visit('/student/profile');

      cy.wait('@failedProfile');

      // Vérifier l'affichage de l'erreur
      cy.contains('Erreur lors du chargement du profil').should('be.visible');
      cy.get('[data-testid="retry-profile-btn"]').should('be.visible');

      // Tester le bouton de retry
      cy.intercept('GET', '**/api/profile', { fixture: 'student-profile.json' }).as('retryProfile');
      cy.get('[data-testid="retry-profile-btn"]').click();
      
      cy.wait('@retryProfile');
      cy.contains('Jean Dupont').should('be.visible');
    });

    it('devrait gérer les erreurs de validation lors de la modification', () => {
      // Simuler une erreur de validation
      cy.intercept('PUT', '**/api/profile', {
        statusCode: 422,
        body: {
          success: false,
          errors: {
            name: ['Le nom est obligatoire'],
            phone: ['Le format du téléphone est invalide']
          }
        }
      }).as('validationError');

      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Essayer de sauvegarder des données invalides
      cy.get('[data-testid="edit-profile-btn"]').click();
      cy.get('[data-testid="name-input"]').clear();
      cy.get('[data-testid="phone-input"]').clear().type('123');
      cy.get('[data-testid="save-profile-btn"]').click();

      cy.wait('@validationError');

      // Vérifier l'affichage des erreurs
      cy.contains('Le nom est obligatoire').should('be.visible');
      cy.contains('Le format du téléphone est invalide').should('be.visible');
    });

    it('devrait gérer les erreurs lors du changement de mot de passe', () => {
      // Simuler une erreur de mot de passe incorrect
      cy.intercept('POST', '**/api/change-password', {
        statusCode: 422,
        body: {
          success: false,
          errors: {
            current_password: ['Le mot de passe actuel est incorrect']
          }
        }
      }).as('passwordError');

      cy.visit('/student/profile');
      cy.wait('@getProfile');

      cy.get('[data-testid="security-tab"]').click();
      cy.get('[data-testid="change-password-btn"]').click();

      // Entrer un mauvais mot de passe actuel
      cy.get('[data-testid="current-password"]').type('mauvaisMotDePasse');
      cy.get('[data-testid="new-password"]').type('nouveauMotDePasse456!');
      cy.get('[data-testid="confirm-password"]').type('nouveauMotDePasse456!');
      cy.get('[data-testid="submit-password-change"]').click();

      cy.wait('@passwordError');

      // Vérifier l'affichage de l'erreur
      cy.contains('Le mot de passe actuel est incorrect').should('be.visible');
    });
  });

  describe('Responsivité mobile', () => {
    it('devrait être responsive sur mobile', () => {
      cy.viewport('iphone-x');
      cy.visit('/student/profile');
      cy.wait('@getProfile');

      // Vérifier que les éléments s'adaptent au mobile
      cy.get('[data-testid="profile-header"]').should('be.visible');
      cy.get('[data-testid="mobile-tabs"]').should('be.visible');

      // Naviguer entre les onglets sur mobile
      cy.get('[data-testid="mobile-tab-progress"]').click();
      cy.get('[data-testid="progress-content"]').should('be.visible');

      cy.get('[data-testid="mobile-tab-settings"]').click();
      cy.get('[data-testid="settings-content"]').should('be.visible');
    });
  });
});