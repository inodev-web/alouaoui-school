describe('Events Management E2E Tests', () => {
  let authToken;

  beforeEach(() => {
    // Intercepter les appels API
    cy.intercept('GET', '**/api/events/slider', { fixture: 'events-slider.json' }).as('getSliderEvents');
    cy.intercept('GET', '**/api/events', { fixture: 'events-slider.json' }).as('getAllEvents');
    cy.intercept('POST', '**/api/events', {
      statusCode: 201,
      body: {
        success: true,
        data: {
          id: 6,
          title: 'Nouvel événement créé',
          description: 'Description du nouvel événement',
          event_type: 'course'
        }
      }
    }).as('createEvent');
    cy.intercept('PUT', '**/api/events/*', {
      statusCode: 200,
      body: {
        success: true,
        data: {
          id: 1,
          title: 'Événement modifié',
          description: 'Description modifiée',
          event_type: 'course'
        }
      }
    }).as('updateEvent');
    cy.intercept('DELETE', '**/api/events/*', {
      statusCode: 200,
      body: { success: true, message: 'Événement supprimé avec succès' }
    }).as('deleteEvent');

    // Connexion en tant qu'admin
    cy.loginAsAdmin();
  });

  describe('Gestion des événements Admin', () => {
    it('devrait afficher la liste des événements', () => {
      cy.visit('/admin/events');
      
      cy.wait('@getAllEvents');
      
      // Vérifier que la page s'affiche correctement
      cy.contains('Gestion des Événements').should('be.visible');
      cy.contains('Nouveau Chapitre: Analyse Avancée').should('be.visible');
      cy.contains('Session Live: Préparation Bac').should('be.visible');
      cy.contains('Offre Spéciale: Abonnement Premium').should('be.visible');

      // Vérifier les filtres
      cy.get('[data-testid="event-type-filter"]').should('be.visible');
      cy.get('[data-testid="search-events"]').should('be.visible');

      // Vérifier les actions disponibles
      cy.get('[data-testid="create-event-btn"]').should('be.visible').and('contain', 'Créer un événement');
      cy.get('[data-testid="event-item"]').should('have.length.at.least', 3);
      
      // Vérifier les boutons d'action pour chaque événement
      cy.get('[data-testid="edit-event-btn"]').should('have.length.at.least', 3);
      cy.get('[data-testid="delete-event-btn"]').should('have.length.at.least', 3);
    });

    it('devrait permettre de filtrer les événements par type', () => {
      cy.visit('/admin/events');
      cy.wait('@getAllEvents');

      // Filtrer par type "course"
      cy.get('[data-testid="event-type-filter"]').select('course');
      cy.get('[data-testid="event-item"]').should('contain', 'Nouveau Chapitre: Analyse Avancée');

      // Filtrer par type "live"
      cy.get('[data-testid="event-type-filter"]').select('live');
      cy.get('[data-testid="event-item"]').should('contain', 'Session Live: Préparation Bac');

      // Retour à tous les types
      cy.get('[data-testid="event-type-filter"]').select('all');
      cy.get('[data-testid="event-item"]').should('have.length.at.least', 3);
    });

    it('devrait permettre de rechercher des événements', () => {
      cy.visit('/admin/events');
      cy.wait('@getAllEvents');

      // Recherche par titre
      cy.get('[data-testid="search-events"]').type('Analyse');
      cy.get('[data-testid="event-item"]').should('have.length', 1);
      cy.get('[data-testid="event-item"]').should('contain', 'Nouveau Chapitre: Analyse Avancée');

      // Effacer la recherche
      cy.get('[data-testid="search-events"]').clear();
      cy.get('[data-testid="event-item"]').should('have.length.at.least', 3);
    });

    it('devrait permettre de créer un nouvel événement', () => {
      cy.visit('/admin/events');
      cy.wait('@getAllEvents');

      // Cliquer sur créer un événement
      cy.get('[data-testid="create-event-btn"]').click();

      // Vérifier que le modal/formulaire s'ouvre
      cy.get('[data-testid="event-form-modal"]').should('be.visible');
      cy.contains('Créer un nouvel événement').should('be.visible');

      // Remplir le formulaire
      cy.get('[data-testid="event-title"]').type('Nouveau Cours de Géométrie');
      cy.get('[data-testid="event-description"]').type('Un cours complet sur la géométrie dans l\'espace');
      cy.get('[data-testid="event-type"]').select('course');
      cy.get('[data-testid="event-redirect-url"]').type('/student/chapters/7');
      cy.get('[data-testid="event-requires-subscription"]').check();
      cy.get('[data-testid="event-button-text"]').type('Commencer le cours');
      cy.get('[data-testid="event-button-color"]').type('#059669');

      // Soumettre le formulaire
      cy.get('[data-testid="submit-event-form"]').click();

      cy.wait('@createEvent');

      // Vérifier la confirmation
      cy.contains('Événement créé avec succès').should('be.visible');
      cy.get('[data-testid="event-form-modal"]').should('not.exist');
    });

    it('devrait permettre de modifier un événement existant', () => {
      cy.visit('/admin/events');
      cy.wait('@getAllEvents');

      // Cliquer sur modifier le premier événement
      cy.get('[data-testid="edit-event-btn"]').first().click();

      // Vérifier que le formulaire de modification s'ouvre
      cy.get('[data-testid="event-form-modal"]').should('be.visible');
      cy.contains('Modifier l\'événement').should('be.visible');

      // Modifier le titre
      cy.get('[data-testid="event-title"]').should('have.value', 'Nouveau Chapitre: Analyse Avancée');
      cy.get('[data-testid="event-title"]').clear().type('Chapitre Modifié: Analyse Approfondie');

      // Modifier la description
      cy.get('[data-testid="event-description"]').clear().type('Description mise à jour avec nouveaux détails');

      // Soumettre les modifications
      cy.get('[data-testid="submit-event-form"]').click();

      cy.wait('@updateEvent');

      // Vérifier la confirmation
      cy.contains('Événement modifié avec succès').should('be.visible');
      cy.get('[data-testid="event-form-modal"]').should('not.exist');
    });

    it('devrait permettre de supprimer un événement', () => {
      cy.visit('/admin/events');
      cy.wait('@getAllEvents');

      // Cliquer sur supprimer le dernier événement
      cy.get('[data-testid="delete-event-btn"]').last().click();

      // Vérifier la demande de confirmation
      cy.get('[data-testid="delete-confirmation-modal"]').should('be.visible');
      cy.contains('Êtes-vous sûr de vouloir supprimer cet événement ?').should('be.visible');

      // Confirmer la suppression
      cy.get('[data-testid="confirm-delete-btn"]').click();

      cy.wait('@deleteEvent');

      // Vérifier la confirmation
      cy.contains('Événement supprimé avec succès').should('be.visible');
    });
  });

  describe('Affichage des événements pour les étudiants', () => {
    beforeEach(() => {
      // Se connecter en tant qu'étudiant
      cy.loginAsStudent();
    });

    it('devrait afficher le slider d\'événements sur la page d\'accueil', () => {
      cy.visit('/student/dashboard');
      
      cy.wait('@getSliderEvents');

      // Vérifier que le slider s'affiche
      cy.get('[data-testid="events-slider"]').should('be.visible');
      cy.get('[data-testid="slider-item"]').should('have.length.at.least', 3);

      // Vérifier le contenu du premier événement
      cy.get('[data-testid="slider-item"]').first().within(() => {
        cy.contains('Nouveau Chapitre: Analyse Avancée').should('be.visible');
        cy.contains('Prof. Alouaoui').should('be.visible');
        cy.get('[data-testid="event-button"]').should('contain', 'Commencer maintenant');
      });
    });

    it('devrait permettre de naviguer dans le slider', () => {
      cy.visit('/student/dashboard');
      cy.wait('@getSliderEvents');

      // Vérifier les boutons de navigation
      cy.get('[data-testid="slider-prev-btn"]').should('be.visible');
      cy.get('[data-testid="slider-next-btn"]').should('be.visible');

      // Naviguer vers l'événement suivant
      cy.get('[data-testid="slider-next-btn"]').click();
      cy.get('[data-testid="slider-item"].active').should('contain', 'Session Live: Préparation Bac');

      // Naviguer vers l'événement précédent
      cy.get('[data-testid="slider-prev-btn"]').click();
      cy.get('[data-testid="slider-item"].active').should('contain', 'Nouveau Chapitre: Analyse Avancée');
    });

    it('devrait gérer les événements avec abonnement requis', () => {
      cy.visit('/student/dashboard');
      cy.wait('@getSliderEvents');

      // Trouver un événement nécessitant un abonnement mais non accessible
      cy.get('[data-testid="slider-item"]').contains('Nouveau: Exercices Interactifs').parent().within(() => {
        cy.get('[data-testid="event-button"]').should('be.disabled');
        cy.contains('Abonnement requis').should('be.visible');
        cy.get('[data-testid="access-message"]').should('contain', 'Abonnement requis pour accéder aux exercices interactifs');
      });
    });

    it('devrait permettre d\'accéder aux événements accessibles', () => {
      cy.visit('/student/dashboard');
      cy.wait('@getSliderEvents');

      // Cliquer sur un événement accessible
      cy.get('[data-testid="slider-item"]').first().within(() => {
        cy.get('[data-testid="event-button"]').click();
      });

      // Vérifier la redirection (simulée)
      cy.url().should('include', '/student/chapters/6');
    });

    it('devrait afficher différents types d\'événements correctement', () => {
      cy.visit('/student/dashboard');
      cy.wait('@getSliderEvents');

      // Événement de type cours
      cy.get('[data-testid="slider-item"]').contains('Nouveau Chapitre: Analyse Avancée').parent().within(() => {
        cy.get('[data-testid="event-type-badge"]').should('contain', 'Cours');
        cy.get('[data-testid="event-icon"]').should('have.class', 'course-icon');
      });

      // Naviguer vers l'événement live
      cy.get('[data-testid="slider-next-btn"]').click();
      cy.get('[data-testid="slider-item"]').contains('Session Live: Préparation Bac').parent().within(() => {
        cy.get('[data-testid="event-type-badge"]').should('contain', 'Live');
        cy.get('[data-testid="live-info"]').should('be.visible');
        cy.contains('23 participants').should('be.visible');
      });

      // Naviguer vers l'événement promotion
      cy.get('[data-testid="slider-next-btn"]').click();
      cy.get('[data-testid="slider-item"]').contains('Offre Spéciale: Abonnement Premium').parent().within(() => {
        cy.get('[data-testid="event-type-badge"]').should('contain', 'Promotion');
        cy.get('[data-testid="discount-badge"]').should('contain', '20% de réduction');
      });
    });
  });

  describe('Événements en temps réel', () => {
    it('devrait mettre à jour automatiquement les événements live', () => {
      cy.loginAsStudent();
      cy.visit('/student/dashboard');
      cy.wait('@getSliderEvents');

      // Simuler une mise à jour des données d'événement live
      cy.intercept('GET', '**/api/events/slider', {
        fixture: 'events-slider.json',
        delay: 1000
      }).as('refreshSliderEvents');

      // Attendre le rechargement automatique (simulé)
      cy.wait(5000);
      cy.wait('@refreshSliderEvents');

      // Vérifier que les données sont mises à jour
      cy.get('[data-testid="events-slider"]').should('be.visible');
      cy.get('[data-testid="slider-item"]').should('have.length.at.least', 3);
    });
  });

  describe('Gestion des erreurs', () => {
    it('devrait gérer les erreurs de chargement des événements', () => {
      // Simuler une erreur API
      cy.intercept('GET', '**/api/events/slider', {
        statusCode: 500,
        body: { error: 'Erreur serveur' }
      }).as('failedSliderEvents');

      cy.loginAsStudent();
      cy.visit('/student/dashboard');

      cy.wait('@failedSliderEvents');

      // Vérifier l'affichage de l'erreur
      cy.contains('Erreur lors du chargement des événements').should('be.visible');
      cy.get('[data-testid="retry-events-btn"]').should('be.visible');

      // Tester le bouton de retry
      cy.intercept('GET', '**/api/events/slider', { fixture: 'events-slider.json' }).as('retrySliderEvents');
      cy.get('[data-testid="retry-events-btn"]').click();
      
      cy.wait('@retrySliderEvents');
      cy.get('[data-testid="events-slider"]').should('be.visible');
    });

    it('devrait gérer les erreurs lors de la création d\'événements', () => {
      // Simuler une erreur lors de la création
      cy.intercept('POST', '**/api/events', {
        statusCode: 422,
        body: {
          success: false,
          errors: {
            title: ['Le titre est obligatoire'],
            description: ['La description est obligatoire']
          }
        }
      }).as('failedCreateEvent');

      cy.loginAsAdmin();
      cy.visit('/admin/events');
      cy.wait('@getAllEvents');

      // Essayer de créer un événement sans données
      cy.get('[data-testid="create-event-btn"]').click();
      cy.get('[data-testid="submit-event-form"]').click();

      cy.wait('@failedCreateEvent');

      // Vérifier l'affichage des erreurs
      cy.contains('Le titre est obligatoire').should('be.visible');
      cy.contains('La description est obligatoire').should('be.visible');
    });
  });
});