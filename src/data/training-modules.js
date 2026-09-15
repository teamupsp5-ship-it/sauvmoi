export const TRAINING_MODULES = [
  {
    "id": "pls",
    "order": 1,
    "icon": "user-check",
    "color": "#1565C0",
    "difficulty": "Facile",
    "image": "https://images.unsplash.com/photo-1649260257572-91bf6f94cff6?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Position Latérale de Sécurité",
      "description": "Protéger une personne inconsciente qui respire",
      "steps": [
        {
          "title": "Vérifier la réaction",
          "substeps": [
            "Secouez doucement les épaules",
            "Parlez fort à la personne",
            "Si pas de réponse, passez à l'étape suivante"
          ]
        },
        {
          "title": "Vérifier la respiration",
          "substeps": [
            "Basculez légèrement la tête en arrière",
            "Regardez/écoutez/sentez pendant 10 secondes max"
          ]
        },
        {
          "title": "Positionner le bras proche",
          "substeps": [
            "Placez le bras le plus proche de vous à angle droit du corps",
            "Coude plié",
            "Paume vers le haut"
          ]
        },
        {
          "title": "Saisir le bras éloigné",
          "substeps": [
            "Attrapez le bras opposé",
            "Placez le dos de sa main contre son oreille côté secouriste"
          ]
        },
        {
          "title": "Tourner sur le côté",
          "substeps": [
            "Saisissez la jambe éloignée sous le genou",
            "Tirez pour faire pivoter le corps sur le côté"
          ]
        },
        {
          "title": "Stabiliser et surveiller",
          "substeps": [
            "Inclinez la tête vers le bas",
            "Jambe du dessus pliée",
            "Alertez le 185",
            "Surveillez la respiration jusqu'aux secours"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Pourquoi met-on une personne en PLS ?",
          "options": [
            "Pour la réveiller plus vite",
            "Pour éviter l'obstruction des voies respiratoires par la langue ou les vomissements",
            "Pour la réchauffer"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "En cas d'inconscience, les muscles de la langue se relâchent et peuvent obstruer le passage de l'air. La PLS, tête légèrement inclinée vers le bas, permet aux liquides (vomissements, salive) de s'écouler plutôt que d'être inhalés."
        },
        {
          "question": "La PLS s'applique à une personne qui...",
          "options": [
            "Respire normalement mais ne répond pas",
            "Ne respire pas du tout"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Une personne qui respire mais reste inconsciente garde un risque d'obstruction des voies aériennes ; si elle ne respire plus du tout, la priorité est la réanimation cardio-pulmonaire, pas la PLS."
        },
        {
          "question": "Quelle position pour une femme enceinte ?",
          "options": [
            "Côté gauche",
            "Côté droit",
            "Peu importe"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Sur le côté gauche, l'utérus comprime moins la veine cave inférieure, ce qui maintient un meilleur retour veineux et évite une chute de tension chez la mère."
        },
        {
          "question": "Si vous êtes seul, quand alerter les secours ?",
          "options": [
            "Avant de faire la PLS",
            "Après avoir mis en PLS",
            "On n'appelle pas"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Sécuriser d'abord les voies respiratoires évite qu'une obstruction ne s'aggrave pendant que vous cherchez de l'aide ou votre téléphone."
        },
        {
          "question": "Peut-on utiliser la PLS en cas de traumatisme du dos ?",
          "options": [
            "Oui systématiquement",
            "Non, sauf danger vital immédiat"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Retourner un traumatisé du dos comporte un risque d'aggraver une lésion de la colonne ; on ne le fait que si les voies respiratoires ou la vie sont directement menacées, faute d'alternative."
        }
      ]
    },
    "en": {
      "title": "Recovery Position",
      "description": "Protect an unconscious person who is breathing",
      "steps": [
        {
          "title": "Check responsiveness",
          "substeps": [
            "Gently shake the shoulders",
            "Speak loudly to the person",
            "If there's no response, move to the next step"
          ]
        },
        {
          "title": "Check breathing",
          "substeps": [
            "Tilt the head back slightly",
            "Look, listen, and feel for breathing for up to 10 seconds"
          ]
        },
        {
          "title": "Position the near arm",
          "substeps": [
            "Place the arm closest to you at a right angle to the body",
            "Elbow bent",
            "Palm facing up"
          ]
        },
        {
          "title": "Grab the far arm",
          "substeps": [
            "Grab the opposite arm",
            "Place the back of their hand against their ear, on the rescuer's side"
          ]
        },
        {
          "title": "Roll onto the side",
          "substeps": [
            "Grab the far leg under the knee",
            "Pull to roll the body onto its side"
          ]
        },
        {
          "title": "Stabilize and monitor",
          "substeps": [
            "Tilt the head downward",
            "Top leg bent",
            "Call 185",
            "Monitor breathing until help arrives"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Why do we place a person in the recovery position?",
          "options": [
            "To wake them up faster",
            "To prevent the airway from being blocked by the tongue or vomit",
            "To keep them warm"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "When a person is unconscious, the tongue muscles relax and can block the airway. The recovery position, with the head tilted slightly downward, allows fluids (vomit, saliva) to drain out instead of being inhaled."
        },
        {
          "question": "The recovery position is used for a person who...",
          "options": [
            "Is breathing normally but not responding",
            "Is not breathing at all"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "A person who is breathing but remains unconscious still has a risk of airway obstruction; if they are not breathing at all, the priority is CPR, not the recovery position."
        },
        {
          "question": "Which position for a pregnant woman?",
          "options": [
            "Left side",
            "Right side",
            "It doesn't matter"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "On the left side, the uterus puts less pressure on the inferior vena cava, which maintains better venous return and prevents a drop in the mother's blood pressure."
        },
        {
          "question": "If you're alone, when should you call for help?",
          "options": [
            "Before performing the recovery position",
            "After placing them in the recovery position",
            "You don't need to call"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Securing the airway first prevents an obstruction from worsening while you look for help or your phone."
        },
        {
          "question": "Can the recovery position be used if there's a back injury?",
          "options": [
            "Yes, always",
            "No, unless there's immediate life-threatening danger"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Rolling someone with a back injury carries a risk of worsening a spinal injury; it should only be done if the airway or life is directly threatened, with no alternative."
        }
      ]
    }
  },
  {
    "id": "etouffement",
    "order": 2,
    "icon": "wind",
    "color": "#C0392B",
    "difficulty": "Facile",
    "image": "https://images.pexels.com/photos/11352535/pexels-photo-11352535.jpeg?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Étouffement (Heimlich)",
      "description": "Dégager des voies respiratoires obstruées",
      "steps": [
        {
          "title": "Identifier l'urgence",
          "substeps": [
            "Demandez \"Tu t'étouffes ?\"",
            "Si la personne ne peut ni parler ni respirer ni tousser, agissez immédiatement"
          ]
        },
        {
          "title": "5 tapes dans le dos",
          "substeps": [
            "Penchez la victime en avant",
            "Donnez 5 tapes fermes entre les omoplates avec le plat de la main"
          ]
        },
        {
          "title": "Méthode de Heimlich",
          "substeps": [
            "Si inefficace : placez-vous derrière",
            "Poing fermé sous le sternum",
            "L'autre main par-dessus",
            "Tirez vers vous et le haut, 5 fois"
          ]
        },
        {
          "title": "Alternez",
          "substeps": [
            "Alternez 5 tapes dans le dos et 5 compressions abdominales jusqu'à expulsion du corps étranger"
          ]
        },
        {
          "title": "Si inconscience",
          "substeps": [
            "Si la personne perd connaissance : allongez-la",
            "Débutez la RCP",
            "Appelez le 185"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Combien de tapes dans le dos au début ?",
          "options": [
            "1",
            "5",
            "10"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Cinq tapes fermes suffisent généralement à créer assez de pression d'air pour déloger le corps étranger sans traumatiser inutilement la victime."
        },
        {
          "question": "Où placer le poing pour Heimlich ?",
          "options": [
            "Sur la poitrine",
            "Sous le sternum (creux de l'estomac)",
            "Sur le dos"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une compression sous le sternum comprime le diaphragme, ce qui augmente brusquement la pression dans les poumons et projette l'air (et le corps étranger) vers le haut."
        },
        {
          "question": "Si la personne devient inconsciente ?",
          "options": [
            "Continuer Heimlich debout",
            "Allonger et débuter la RCP, appeler 185"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Les compressions thoraciques de la RCP peuvent elles-mêmes déloger le corps étranger, en plus de maintenir une circulation minimale en attendant les secours."
        },
        {
          "question": "Une personne qui tousse fort s'étouffe-t-elle gravement ?",
          "options": [
            "Oui, agir immédiatement",
            "Non, la toux signifie que l'air passe encore - encouragez-la à tousser"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une toux efficace prouve que les voies aériennes ne sont pas complètement bloquées ; intervenir à ce stade (tapes, Heimlich) pourrait au contraire déplacer l'obstruction et aggraver la situation."
        },
        {
          "question": "Combien de cycles tapes/compressions au maximum ?",
          "options": [
            "On s'arrête après 1 cycle",
            "On alterne jusqu'à expulsion ou inconscience"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le corps étranger peut nécessiter plusieurs cycles pour se déloger ; il n'y a pas de limite fixe tant que la victime reste consciente et que l'obstruction persiste."
        },
        {
          "question": "Sur un nourrisson, utilise-t-on Heimlich classique ?",
          "options": [
            "Oui, identique à l'adulte",
            "Non, technique adaptée différente"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Les compressions abdominales du Heimlich classique risquent de léser les organes fragiles d'un nourrisson ; on utilise à la place des tapes dorsales et compressions thoraciques à deux doigts."
        },
        {
          "question": "Quels signes indiquent qu'une personne s'étouffe gravement (obstruction complète) ?",
          "options": [
            "Elle ne peut plus parler ni tousser",
            "Elle porte les mains à sa gorge",
            "Elle respire bruyamment mais normalement",
            "Elle devient bleue au niveau des lèvres (cyanose)"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "L'incapacité à parler ou tousser, le geste réflexe de porter les mains à la gorge (signe universel d'étouffement) et la cyanose des lèvres traduisent tous une obstruction complète des voies aériennes empêchant l'air d'atteindre les poumons."
        }
      ]
    },
    "en": {
      "title": "Choking (Heimlich Maneuver)",
      "description": "Clear a blocked airway",
      "steps": [
        {
          "title": "Identify the emergency",
          "substeps": [
            "Ask \"Are you choking?\"",
            "If the person can't speak, breathe, or cough, act immediately"
          ]
        },
        {
          "title": "5 back blows",
          "substeps": [
            "Lean the victim forward",
            "Give 5 firm blows between the shoulder blades with the heel of your hand"
          ]
        },
        {
          "title": "Heimlich maneuver",
          "substeps": [
            "If ineffective: stand behind them",
            "Closed fist below the sternum",
            "Other hand on top",
            "Pull inward and upward, 5 times"
          ]
        },
        {
          "title": "Alternate",
          "substeps": [
            "Alternate 5 back blows and 5 abdominal thrusts until the object is expelled"
          ]
        },
        {
          "title": "If unconscious",
          "substeps": [
            "If the person loses consciousness: lay them down",
            "Begin CPR",
            "Call 185"
          ]
        }
      ],
      "quiz": [
        {
          "question": "How many back blows at the start?",
          "options": [
            "1",
            "5",
            "10"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Five firm blows are usually enough to create sufficient air pressure to dislodge the object without unnecessarily injuring the victim."
        },
        {
          "question": "Where should you place your fist for the Heimlich maneuver?",
          "options": [
            "On the chest",
            "Below the sternum (pit of the stomach)",
            "On the back"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A compression below the sternum presses on the diaphragm, which sharply increases pressure in the lungs and forces air (and the foreign object) upward."
        },
        {
          "question": "If the person becomes unconscious?",
          "options": [
            "Keep doing the Heimlich maneuver standing up",
            "Lay them down, begin CPR, and call 185"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "CPR chest compressions can themselves dislodge the foreign object, in addition to maintaining minimal circulation while waiting for help."
        },
        {
          "question": "Is someone coughing forcefully choking severely?",
          "options": [
            "Yes, act immediately",
            "No, coughing means air is still getting through — encourage them to keep coughing"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "An effective cough proves the airway is not completely blocked; intervening at this stage (back blows, Heimlich) could instead shift the obstruction and worsen the situation."
        },
        {
          "question": "What's the maximum number of back blow/thrust cycles?",
          "options": [
            "You stop after 1 cycle",
            "You alternate until the object is expelled or the person becomes unconscious"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The foreign object may take several cycles to dislodge; there is no fixed limit as long as the victim remains conscious and the obstruction persists."
        },
        {
          "question": "Is the classic Heimlich maneuver used on an infant?",
          "options": [
            "Yes, the same as for an adult",
            "No, a different adapted technique is used"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Classic Heimlich abdominal thrusts risk injuring an infant's fragile organs; instead, back blows and two-finger chest thrusts are used."
        },
        {
          "question": "Which signs indicate someone is choking severely (complete obstruction)?",
          "options": [
            "They can no longer speak or cough",
            "They clutch their throat with their hands",
            "They are breathing noisily but normally",
            "Their lips are turning blue (cyanosis)"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "The inability to speak or cough, the reflex of clutching the throat (the universal choking sign), and blue lips all indicate a complete airway obstruction preventing air from reaching the lungs."
        }
      ]
    }
  },
  {
    "id": "hemorragie",
    "order": 3,
    "icon": "droplet",
    "color": "#C0392B",
    "difficulty": "Moyen",
    "image": "https://images.unsplash.com/photo-1624638760852-8ede1666ab07?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Hémorragie",
      "description": "Arrêter un saignement abondant",
      "steps": [
        {
          "title": "Protégez-vous",
          "substeps": [
            "Si possible, mettez des gants ou un sac plastique sur vos mains avant tout contact"
          ]
        },
        {
          "title": "Compression directe",
          "substeps": [
            "Appuyez fermement sur la plaie avec un linge propre ou la main protégée"
          ]
        },
        {
          "title": "Maintenez la pression",
          "substeps": [
            "Ne relâchez jamais",
            "Ajoutez du tissu par-dessus si besoin, sans retirer le premier"
          ]
        },
        {
          "title": "Allongez et surélevez",
          "substeps": [
            "Allongez la victime",
            "Surélevez le membre blessé au-dessus du niveau du cœur si pas de fracture"
          ]
        },
        {
          "title": "Alertez le 185",
          "substeps": [
            "Appelez les secours immédiatement pour toute hémorragie abondante"
          ]
        },
        {
          "title": "Garrot en dernier recours",
          "substeps": [
            "Si saignement incontrôlable d'un membre et secours non disponibles rapidement, un garrot peut être posé par une personne formée"
          ]
        },
        {
          "title": "Surveillez",
          "substeps": [
            "Surveillez l'état de conscience et la respiration jusqu'à l'arrivée des secours"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Quels gestes permettent de ralentir un saignement abondant ?",
          "options": [
            "Compression directe sur la plaie",
            "Surélever le membre si pas de fracture",
            "Laisser saigner pour que la plaie se nettoie seule",
            "Appliquer un tissu propre en pansement compressif"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "La compression directe, l'élévation du membre et un pansement compressif agissent ensemble pour réduire le débit sanguin local ; laisser saigner ne favorise ni le nettoyage ni l'arrêt du saignement."
        },
        {
          "question": "Faut-il retirer le linge imbibé de sang ?",
          "options": [
            "Oui, toujours",
            "Non, en rajouter par-dessus"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Retirer le linge arracherait les caillots en formation et relancerait le saignement ; ajouter du tissu par-dessus maintient la compression sans interrompre la coagulation déjà en cours."
        },
        {
          "question": "Quand appeler le SAMU ?",
          "options": [
            "Seulement si la personne le demande",
            "Immédiatement pour une hémorragie importante"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une hémorragie abondante peut entraîner un état de choc en quelques minutes ; alerter immédiatement permet aux secours médicalisés d'arriver pendant que la compression est encore efficace."
        },
        {
          "question": "Faut-il surélever le membre blessé ?",
          "options": [
            "Oui si pas de fracture suspectée",
            "Jamais"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Surélever le membre au-dessus du niveau du cœur réduit la pression sanguine locale et donc le débit du saignement, à condition qu'aucune fracture ne rende ce geste dangereux."
        },
        {
          "question": "Dans quelles situations la pose d'un garrot est-elle justifiée ?",
          "options": [
            "Hémorragie d'un membre incontrôlable malgré une compression directe bien faite",
            "Secours qui tarderont à arriver",
            "Petite coupure superficielle qui saigne un peu",
            "Personne formée disponible pour le poser"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Le garrot ne se justifie que lorsque la compression directe échoue sur une hémorragie de membre sévère, que les secours sont retardés, et qu'une personne sait le poser correctement — jamais pour un saignement mineur qu'une simple compression suffit à arrêter."
        },
        {
          "question": "Pourquoi se protéger les mains ?",
          "options": [
            "Pour ne pas se salir",
            "Pour éviter tout risque de transmission infectieuse"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le sang peut transmettre des agents infectieux (hépatites, VIH...) ; une barrière physique protège le secouriste sans retarder l'intervention."
        },
        {
          "question": "Quels paramètres faut-il surveiller chez la victime en attendant les secours ?",
          "options": [
            "Son état de conscience",
            "Sa respiration",
            "La couleur de ses vêtements",
            "Les signes de pâleur ou de sueurs froides (choc)"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "La conscience, la respiration et les signes de pâleur/sueurs froides sont les indicateurs cliniques d'une aggravation vers un état de choc hémorragique ; la couleur des vêtements n'a aucune valeur médicale."
        },
        {
          "question": "Peut-on donner à boire à la victime ?",
          "options": [
            "Oui pour la réhydrater",
            "Non, ne rien donner à boire ou manger"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "En cas de choc ou de perte de conscience possible, avaler expose à une fausse route ; de plus une éventuelle intervention chirurgicale urgente impose l'estomac vide."
        },
        {
          "question": "Combien de linges maximum peut-on superposer ?",
          "options": [
            "Un seul, jamais plus",
            "Autant que nécessaire, sans retirer les précédents"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Il n'existe pas de limite : superposer préserve les caillots déjà formés sous les premières couches tout en renforçant la compression."
        },
        {
          "question": "Une hémorragie qui ne s'arrête pas après compression nécessite ?",
          "options": [
            "Patienter encore 30 minutes",
            "Appel immédiat aux secours si pas déjà fait"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un saignement qui persiste malgré une compression bien menée signale une lésion vasculaire importante nécessitant une prise en charge médicale sans délai."
        }
      ]
    },
    "en": {
      "title": "Bleeding",
      "description": "Stop heavy bleeding",
      "steps": [
        {
          "title": "Protect yourself",
          "substeps": [
            "If possible, put on gloves or a plastic bag over your hands before any contact"
          ]
        },
        {
          "title": "Direct pressure",
          "substeps": [
            "Press firmly on the wound with a clean cloth or a protected hand"
          ]
        },
        {
          "title": "Maintain the pressure",
          "substeps": [
            "Never release it",
            "Add more cloth on top if needed, without removing the first layer"
          ]
        },
        {
          "title": "Lay down and elevate",
          "substeps": [
            "Lay the victim down",
            "Raise the injured limb above heart level if there's no fracture"
          ]
        },
        {
          "title": "Call 185",
          "substeps": [
            "Call for help immediately for any heavy bleeding"
          ]
        },
        {
          "title": "Tourniquet as a last resort",
          "substeps": [
            "If bleeding from a limb is uncontrollable and help is not available quickly, a tourniquet can be applied by a trained person"
          ]
        },
        {
          "title": "Monitor",
          "substeps": [
            "Monitor consciousness and breathing until help arrives"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Which actions help slow heavy bleeding?",
          "options": [
            "Direct pressure on the wound",
            "Elevating the limb if there's no fracture",
            "Letting it bleed so the wound cleans itself",
            "Applying a clean cloth as a pressure dressing"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Direct pressure, limb elevation, and a pressure dressing work together to reduce local blood flow; letting a wound bleed neither cleans it nor stops the bleeding."
        },
        {
          "question": "Should you remove a blood-soaked cloth?",
          "options": [
            "Yes, always",
            "No, add more on top of it"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Removing the cloth would tear away forming clots and restart the bleeding; adding more cloth on top maintains pressure without interrupting the clotting already underway."
        },
        {
          "question": "When should you call SAMU (emergency medical services)?",
          "options": [
            "Only if the person asks you to",
            "Immediately for significant bleeding"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Heavy bleeding can lead to shock within minutes; calling immediately allows medical help to arrive while direct pressure is still effective."
        },
        {
          "question": "Should the injured limb be elevated?",
          "options": [
            "Yes, if a fracture isn't suspected",
            "Never"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Elevating the limb above heart level reduces local blood pressure and therefore the rate of bleeding, provided no fracture makes this action dangerous."
        },
        {
          "question": "In which situations is applying a tourniquet justified?",
          "options": [
            "Uncontrollable limb bleeding despite properly applied direct pressure",
            "Help that will be delayed in arriving",
            "A small superficial cut that bleeds a little",
            "A trained person available to apply it"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "A tourniquet is only justified when direct pressure fails on severe limb bleeding, help is delayed, and someone knows how to apply it correctly — never for minor bleeding that simple pressure can stop."
        },
        {
          "question": "Why protect your hands?",
          "options": [
            "To avoid getting dirty",
            "To avoid any risk of infectious transmission"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Blood can transmit infectious agents (hepatitis, HIV...); a physical barrier protects the rescuer without delaying the intervention."
        },
        {
          "question": "Which signs should you monitor in the victim while waiting for help?",
          "options": [
            "Their level of consciousness",
            "Their breathing",
            "The color of their clothes",
            "Signs of paleness or cold sweats (shock)"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Consciousness, breathing, and signs of paleness/cold sweats are clinical indicators of worsening toward hemorrhagic shock; the color of someone's clothes has no medical significance."
        },
        {
          "question": "Can you give the victim something to drink?",
          "options": [
            "Yes, to rehydrate them",
            "No, don't give anything to eat or drink"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "In case of shock or possible loss of consciousness, swallowing risks choking; also, a possible emergency surgery requires an empty stomach."
        },
        {
          "question": "What's the maximum number of cloths you can layer?",
          "options": [
            "Only one, never more",
            "As many as needed, without removing the previous ones"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "There is no limit: layering preserves the clots already formed under the first layers while reinforcing the pressure."
        },
        {
          "question": "Bleeding that doesn't stop after applying pressure requires?",
          "options": [
            "Waiting another 30 minutes",
            "Calling for help immediately if not already done"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Bleeding that persists despite properly applied pressure indicates a significant vascular injury requiring immediate medical care."
        }
      ]
    }
  },
  {
    "id": "brulures",
    "order": 4,
    "icon": "flame",
    "color": "#E67E22",
    "difficulty": "Moyen",
    "image": "https://images.unsplash.com/photo-1564144573017-8dc932e0039e?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Brûlures",
      "description": "Premiers gestes face à une brûlure",
      "steps": [
        {
          "title": "Éloignez du danger",
          "substeps": [
            "Écartez immédiatement la victime de la source de chaleur (feu, électricité, produit chimique)"
          ]
        },
        {
          "title": "Refroidissez",
          "substeps": [
            "Passez la zone brûlée sous l'eau froide (15-20°C, pas glacée) pendant 15 à 20 minutes"
          ]
        },
        {
          "title": "Retirez bijoux et vêtements",
          "substeps": [
            "Retirez bagues, bracelets et vêtements non collés à la peau avant que ça gonfle"
          ]
        },
        {
          "title": "Ne percez jamais",
          "substeps": [
            "Ne percez jamais les cloques",
            "N'appliquez ni crème, ni pommade, ni glace directe"
          ]
        },
        {
          "title": "Protégez",
          "substeps": [
            "Couvrez avec un linge propre et humide, non pelucheux"
          ]
        },
        {
          "title": "Alertez si nécessaire",
          "substeps": [
            "Appelez le 185 si brûlure étendue, profonde, sur le visage/mains/organes génitaux, ou chez un enfant"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Combien de temps refroidir une brûlure ?",
          "options": [
            "2-3 minutes",
            "15-20 minutes",
            "1 heure"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Refroidir au moins 15 à 20 minutes stoppe la diffusion de la chaleur dans les tissus profonds, qui continue bien après le contact avec la source de chaleur."
        },
        {
          "question": "Que ne faut-il JAMAIS faire sur une brûlure ?",
          "options": [
            "Percer les cloques",
            "Refroidir à l'eau froide immédiatement",
            "Arracher un vêtement collé à la peau",
            "Couvrir avec un linge propre et humide"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Percer une cloque ouvre la peau aux infections, et arracher un vêtement collé arrache aussi la peau sous-jacente — deux gestes à proscrire, contrairement au refroidissement et à la protection par un linge propre qui sont recommandés."
        },
        {
          "question": "Quelles caractéristiques doit avoir l'eau utilisée pour refroidir une brûlure ?",
          "options": [
            "Froide, environ 15-20°C",
            "Glacée (avec des glaçons)",
            "Appliquée pendant 15 à 20 minutes",
            "Appliquée seulement quelques secondes"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Une eau froide (pas glacée, pour éviter un choc thermique et une vasoconstriction excessive) appliquée 15 à 20 minutes refroidit les tissus en profondeur ; l'eau glacée ou une application trop brève sont inefficaces voire délétères."
        },
        {
          "question": "Faut-il retirer les bijoux près de la brûlure ?",
          "options": [
            "Oui, avant que ça gonfle",
            "Non, laisser en place"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "La zone brûlée gonfle rapidement ; un bijou resté en place peut ensuite comprimer les tissus et couper la circulation comme un garrot involontaire."
        },
        {
          "question": "Peut-on appliquer du dentifrice ou du beurre ?",
          "options": [
            "Oui, c'est un remède traditionnel efficace",
            "Non, jamais - seulement de l'eau froide"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Les corps gras emprisonnent la chaleur au lieu de l'évacuer et compliquent l'évaluation médicale de la brûlure ; seule l'eau froide est reconnue efficace."
        },
        {
          "question": "Dans quels cas une brûlure nécessite-t-elle un appel systématique au 185 ?",
          "options": [
            "Brûlure étendue (grande surface)",
            "Brûlure sur le visage, les mains ou les organes génitaux",
            "Petite rougeur qui disparaît en quelques minutes",
            "Brûlure chez un enfant en bas âge"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "L'étendue, la localisation sur une zone fonctionnelle ou sensible (visage, mains, organes génitaux) et le jeune âge sont des critères de gravité reconnus qui justifient un avis médical urgent ; une rougeur passagère ne relève pas de l'urgence."
        },
        {
          "question": "Faut-il enlever un vêtement collé à la peau brûlée ?",
          "options": [
            "Oui en tirant fort",
            "Non, ne jamais arracher un vêtement collé"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Arracher un tissu collé à la peau brûlée arracherait aussi la peau sous-jacente ; on découpe autour et on laisse le reste en place pour les secours."
        },
        {
          "question": "Une brûlure électrique nécessite-t-elle un avis médical systématique ?",
          "options": [
            "Non si la peau semble normale",
            "Oui, toujours, risque de lésions internes"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le courant électrique peut léser des tissus profonds (muscles, cœur) invisibles depuis la surface de la peau, d'où la nécessité d'un bilan médical même si la peau paraît peu atteinte."
        },
        {
          "question": "Le linge de protection doit être ?",
          "options": [
            "En coton pelucheux",
            "Propre et non pelucheux"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un tissu pelucheux peut laisser des fibres qui adhèrent à la plaie et compliquent les soins ultérieurs ; un linge propre et lisse limite ce risque."
        },
        {
          "question": "Chez l'enfant, le seuil de gravité est-il le même que chez l'adulte ?",
          "options": [
            "Oui identique",
            "Non, plus bas - consulter plus facilement"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "La peau d'un enfant est plus fine et sa surface corporelle proportionnellement plus grande, ce qui rend une même brûlure plus grave et plus vite dangereuse que chez un adulte."
        },
        {
          "question": "Que faire face à une brûlure chimique ?",
          "options": [
            "Rincer abondamment et longuement à l'eau claire",
            "Retirer les vêtements imprégnés du produit",
            "Neutraliser le produit avec un autre produit chimique",
            "Protéger ses propres mains avant de toucher la victime"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Rincer abondamment dilue et élimine le produit en continu, retirer les vêtements imprégnés stoppe le contact prolongé, et se protéger évite au secouriste d'être lui-même brûlé ; mélanger des produits chimiques peut provoquer une réaction dangereuse (dégagement de chaleur ou de gaz toxiques)."
        },
        {
          "question": "Une brûlure peut-elle s'aggraver après le refroidissement ?",
          "options": [
            "Non, c'est fini",
            "Oui, surveiller son évolution dans les heures suivantes"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Les lésions tissulaires évoluent parfois sur plusieurs heures ; une brûlure qui semblait limitée peut approfondir et nécessiter une réévaluation."
        }
      ]
    },
    "en": {
      "title": "Burns",
      "description": "First steps for a burn",
      "steps": [
        {
          "title": "Move away from danger",
          "substeps": [
            "Immediately move the victim away from the heat source (fire, electricity, chemical)"
          ]
        },
        {
          "title": "Cool it down",
          "substeps": [
            "Run cool water (15-20°C, not ice-cold) over the burned area for 15 to 20 minutes"
          ]
        },
        {
          "title": "Remove jewelry and clothing",
          "substeps": [
            "Remove rings, bracelets, and clothing not stuck to the skin before swelling starts"
          ]
        },
        {
          "title": "Never pierce",
          "substeps": [
            "Never pierce blisters",
            "Don't apply cream, ointment, or direct ice"
          ]
        },
        {
          "title": "Protect",
          "substeps": [
            "Cover with a clean, damp, non-fluffy cloth"
          ]
        },
        {
          "title": "Call for help if necessary",
          "substeps": [
            "Call 185 if the burn is extensive, deep, on the face/hands/genitals, or on a child"
          ]
        }
      ],
      "quiz": [
        {
          "question": "How long should you cool a burn?",
          "options": [
            "2-3 minutes",
            "15-20 minutes",
            "1 hour"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Cooling for at least 15 to 20 minutes stops heat from spreading into deeper tissue, which continues well after contact with the heat source ends."
        },
        {
          "question": "What should you NEVER do to a burn?",
          "options": [
            "Pierce blisters",
            "Cool it with cold water immediately",
            "Tear off clothing stuck to the skin",
            "Cover it with a clean, damp cloth"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Piercing a blister opens the skin to infection, and tearing off stuck clothing also tears away the skin underneath — both should be avoided, unlike cooling and covering with a clean cloth, which are recommended."
        },
        {
          "question": "What characteristics should the water used to cool a burn have?",
          "options": [
            "Cool, around 15-20°C",
            "Ice-cold (with ice cubes)",
            "Applied for 15 to 20 minutes",
            "Applied for just a few seconds"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Cool water (not ice-cold, to avoid thermal shock and excessive vasoconstriction) applied for 15 to 20 minutes cools the tissue deeply; ice-cold water or too brief an application are ineffective or even harmful."
        },
        {
          "question": "Should jewelry near the burn be removed?",
          "options": [
            "Yes, before it swells",
            "No, leave it in place"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "The burned area swells quickly; jewelry left in place can then compress the tissue and cut off circulation like an unintentional tourniquet."
        },
        {
          "question": "Can you apply toothpaste or butter?",
          "options": [
            "Yes, it's an effective traditional remedy",
            "No, never — only cool water"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Fatty substances trap heat instead of releasing it and make medical assessment of the burn harder; only cool water is recognized as effective."
        },
        {
          "question": "In which cases does a burn always require calling 185?",
          "options": [
            "An extensive burn (large surface area)",
            "A burn on the face, hands, or genitals",
            "Slight redness that fades within minutes",
            "A burn on a young child"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Extent, location on a functional or sensitive area (face, hands, genitals), and young age are recognized severity criteria that justify urgent medical advice; brief redness is not an emergency."
        },
        {
          "question": "Should clothing stuck to burned skin be removed?",
          "options": [
            "Yes, by pulling hard",
            "No, never tear off clothing that's stuck"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Tearing off fabric stuck to burned skin would also tear away the skin underneath; cut around it and leave the rest in place for medical responders."
        },
        {
          "question": "Does an electrical burn always require medical evaluation?",
          "options": [
            "No, if the skin looks normal",
            "Yes, always — risk of internal injury"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Electrical current can damage deep tissue (muscles, heart) that's invisible from the skin's surface, which is why a medical evaluation is needed even if the skin appears only slightly affected."
        },
        {
          "question": "The protective cloth should be?",
          "options": [
            "Fluffy cotton",
            "Clean and non-fluffy"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A fluffy fabric can leave fibers that stick to the wound and complicate later treatment; a clean, smooth cloth limits this risk."
        },
        {
          "question": "Is the severity threshold the same for children as for adults?",
          "options": [
            "Yes, identical",
            "No, lower — seek medical advice more readily"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A child's skin is thinner and their body surface proportionally larger, which makes the same burn more serious and dangerous more quickly than in an adult."
        },
        {
          "question": "What should you do for a chemical burn?",
          "options": [
            "Rinse thoroughly and for a long time with clean water",
            "Remove clothing soaked with the substance",
            "Neutralize the substance with another chemical",
            "Protect your own hands before touching the victim"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Rinsing thoroughly continuously dilutes and removes the substance, removing soaked clothing stops prolonged contact, and protecting yourself prevents the rescuer from being burned too; mixing chemicals can cause a dangerous reaction (heat release or toxic gases)."
        },
        {
          "question": "Can a burn worsen after cooling?",
          "options": [
            "No, it's over",
            "Yes, monitor how it develops over the following hours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Tissue damage sometimes develops over several hours; a burn that seemed minor can deepen and require reassessment."
        }
      ]
    }
  },
  {
    "id": "fractures",
    "order": 5,
    "icon": "bone",
    "color": "#7F8C8D",
    "difficulty": "Moyen",
    "image": "https://images.unsplash.com/photo-1624638760852-8ede1666ab07?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Fractures et Entorses",
      "description": "Immobiliser un membre blessé",
      "steps": [
        {
          "title": "Ne bougez pas le membre",
          "substeps": [
            "Ne tentez jamais de remettre un os en place ou de redresser le membre"
          ]
        },
        {
          "title": "Évaluez",
          "substeps": [
            "Recherchez déformation visible",
            "Douleur intense",
            "Impossibilité de bouger",
            "Gonflement rapide"
          ]
        },
        {
          "title": "Immobilisez",
          "substeps": [
            "Stabilisez le membre dans la position trouvée",
            "Sans forcer",
            "En évitant tout mouvement inutile"
          ]
        },
        {
          "title": "Glacez si entorse simple",
          "substeps": [
            "Appliquez du froid enveloppé dans un tissu (jamais directement sur la peau)"
          ]
        },
        {
          "title": "Ne donnez rien à manger/boire",
          "substeps": [
            "En cas de doute sur une fracture nécessitant chirurgie, ne donnez rien par la bouche"
          ]
        },
        {
          "title": "Alertez si nécessaire",
          "substeps": [
            "Appelez le 185 si déformation visible, fracture ouverte, ou douleur insupportable"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Faut-il remettre un os en place ?",
          "options": [
            "Oui immédiatement",
            "Jamais, attendre les secours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Manipuler un os fracturé sans compétence médicale risque de léser vaisseaux, nerfs ou tissus environnants ; il vaut mieux immobiliser dans la position trouvée et attendre les secours."
        },
        {
          "question": "Quels gestes appliquer face à une entorse simple ?",
          "options": [
            "Glace protégée par un tissu",
            "Chaud directement sur la peau",
            "Repos du membre",
            "Masser vigoureusement la zone"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Le froid limite l'inflammation et la douleur en réduisant le flux sanguin local, et le repos évite d'aggraver la lésion ligamentaire ; chaleur et massage au contraire favorisent le gonflement et peuvent aggraver les dégâts."
        },
        {
          "question": "Une fracture ouverte signifie quoi ?",
          "options": [
            "L'os traverse la peau",
            "La fracture est juste douloureuse"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Quand l'os traverse la peau, la plaie expose l'os à l'air libre, ce qui majore fortement le risque d'infection osseuse et nécessite une prise en charge chirurgicale rapide."
        },
        {
          "question": "Peut-on bouger la victime si elle a très mal ?",
          "options": [
            "Oui pour la mettre plus confortablement",
            "Non, immobiliser sur place"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Bouger un membre fracturé, même pour le confort, peut déplacer les fragments osseux et léser davantage les tissus, vaisseaux ou nerfs autour."
        },
        {
          "question": "Faut-il donner à manger en attendant les secours ?",
          "options": [
            "Oui pour la réconforter",
            "Non, rien par la bouche"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "En cas de fracture grave nécessitant une intervention chirurgicale, l'estomac doit rester vide pour permettre une anesthésie générale sans risque de fausse route."
        },
        {
          "question": "Le glaçon doit-il toucher directement la peau ?",
          "options": [
            "Oui pour plus d'efficacité",
            "Non, toujours protégé par un tissu"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un contact direct et prolongé avec la glace peut provoquer une brûlure par le froid (gelure) ; un tissu intermédiaire protège la peau tout en gardant l'effet anti-inflammatoire du froid."
        },
        {
          "question": "Quels signes doivent faire appeler systématiquement le 185 ?",
          "options": [
            "Déformation visible du membre",
            "Fracture ouverte (os visible)",
            "Douleur insupportable",
            "Une simple courbature après le sport"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Une déformation visible, un os qui traverse la peau ou une douleur insupportable signalent une lésion grave nécessitant une prise en charge médicale immédiate ; une courbature banale ne relève pas de l'urgence."
        },
        {
          "question": "Une entorse et une fracture se distinguent-elles facilement sans examen ?",
          "options": [
            "Oui c'est évident",
            "Non, en cas de doute traiter comme une fracture"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Seule une imagerie médicale (radiographie) permet de confirmer l'absence de fracture ; sans certitude, on immobilise et on traite comme une fracture par précaution."
        },
        {
          "question": "Concernant une chaussure sur un pied possiblement fracturé, que faire ?",
          "options": [
            "La retirer si elle compresse (risque de gonflement)",
            "La retirer en tirant fort si elle résiste",
            "Vérifier la sensibilité des orteils",
            "La laisser si elle ne gêne pas"
          ],
          "correctAnswers": [
            0,
            2,
            3
          ],
          "explanation": "Une chaussure trop serrée peut couper la circulation en cas de gonflement, mais la retirer de force sur un pied fracturé aggrave la douleur et le déplacement ; le bon compromis est de la desserrer sans forcer et de surveiller la sensibilité des orteils."
        },
        {
          "question": "Le gonflement après un traumatisme apparaît...",
          "options": [
            "Immédiatement et jamais après",
            "Parfois progressivement dans les heures qui suivent"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "L'inflammation qui suit un traumatisme se développe sur plusieurs heures, donc l'absence de gonflement immédiat n'exclut pas une fracture."
        },
        {
          "question": "Que faut-il respecter en posant une attelle improvisée ?",
          "options": [
            "Stabiliser sans bouger l'articulation",
            "Vérifier la sensibilité des doigts/orteils après la pose",
            "Serrer le plus fort possible pour bien immobiliser",
            "Utiliser un matériau rigide (planche, carton rigide)"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Une attelle doit stabiliser sans forcer le mouvement, rester assez souple pour ne pas couper la circulation (d'où la vérification de la sensibilité), et s'appuyer sur un support rigide pour être efficace."
        },
        {
          "question": "Le froid réduit principalement ?",
          "options": [
            "La douleur et le gonflement",
            "Le risque de fracture"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Le froid resserre les vaisseaux sanguins locaux (vasoconstriction), ce qui limite l'inflammation et l'accumulation de liquide, réduisant ainsi douleur et gonflement."
        },
        {
          "question": "Faut-il vérifier la sensibilité des doigts/orteils après immobilisation ?",
          "options": [
            "Non inutile",
            "Oui pour vérifier que la circulation n'est pas coupée"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une immobilisation trop serrée peut comprimer nerfs et vaisseaux ; vérifier que la personne sent encore ses doigts ou orteils permet de détecter ce risque à temps."
        },
        {
          "question": "Que faire si une fracture de la colonne vertébrale est suspectée ?",
          "options": [
            "Ne surtout pas bouger la victime",
            "L'asseoir rapidement pour la rassurer",
            "Alerter immédiatement les secours",
            "La laisser dans la position où elle se trouve"
          ],
          "correctAnswers": [
            0,
            2,
            3
          ],
          "explanation": "Un mouvement intempestif du rachis peut aggraver ou provoquer une lésion de la moelle épinière ; il faut donc laisser la victime immobile dans sa position et alerter des secours formés au relevage sécurisé."
        },
        {
          "question": "Le temps d'application du froid recommandé est ?",
          "options": [
            "15-20 minutes",
            "2 heures en continu"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Cette durée suffit à obtenir l'effet anti-inflammatoire du froid sans provoquer de lésion tissulaire par le froid lui-même (gelure)."
        }
      ]
    },
    "en": {
      "title": "Fractures and Sprains",
      "description": "Immobilize an injured limb",
      "steps": [
        {
          "title": "Don't move the limb",
          "substeps": [
            "Never try to set a bone back in place or straighten the limb"
          ]
        },
        {
          "title": "Assess",
          "substeps": [
            "Look for visible deformity",
            "Intense pain",
            "Inability to move",
            "Rapid swelling"
          ]
        },
        {
          "title": "Immobilize",
          "substeps": [
            "Stabilize the limb in the position found",
            "Without forcing it",
            "Avoiding any unnecessary movement"
          ]
        },
        {
          "title": "Apply ice if it's a simple sprain",
          "substeps": [
            "Apply ice wrapped in a cloth (never directly on the skin)"
          ]
        },
        {
          "title": "Don't give anything to eat or drink",
          "substeps": [
            "If a fracture requiring surgery is suspected, give nothing by mouth"
          ]
        },
        {
          "title": "Call for help if necessary",
          "substeps": [
            "Call 185 if there's visible deformity, an open fracture, or unbearable pain"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Should a bone be set back in place?",
          "options": [
            "Yes, immediately",
            "Never — wait for help"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Manipulating a fractured bone without medical training risks damaging surrounding vessels, nerves, or tissue; it is better to immobilize it in the position found and wait for help."
        },
        {
          "question": "What should you do for a simple sprain?",
          "options": [
            "Ice protected by a cloth",
            "Heat applied directly to the skin",
            "Rest the limb",
            "Vigorously massage the area"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Cold limits inflammation and pain by reducing local blood flow, and rest avoids worsening the ligament injury; heat and massage, on the other hand, promote swelling and can worsen the damage."
        },
        {
          "question": "What does an open fracture mean?",
          "options": [
            "The bone pierces through the skin",
            "The fracture is just painful"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "When the bone pierces through the skin, the wound exposes the bone to open air, which greatly increases the risk of bone infection and requires prompt surgical care."
        },
        {
          "question": "Can you move the victim if they're in a lot of pain?",
          "options": [
            "Yes, to make them more comfortable",
            "No, immobilize them where they are"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Moving a fractured limb, even for comfort, can shift the bone fragments and further damage the surrounding tissue, vessels, or nerves."
        },
        {
          "question": "Should you give food while waiting for help?",
          "options": [
            "Yes, to comfort them",
            "No, nothing by mouth"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "In case of a serious fracture requiring surgery, the stomach must remain empty to allow for general anesthesia without risk of choking."
        },
        {
          "question": "Should ice touch the skin directly?",
          "options": [
            "Yes, for better effectiveness",
            "No, always protected by a cloth"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Direct, prolonged contact with ice can cause a cold burn (frostbite); a cloth barrier protects the skin while keeping the anti-inflammatory effect of the cold."
        },
        {
          "question": "Which signs should always prompt a call to 185?",
          "options": [
            "Visible deformity of the limb",
            "Open fracture (visible bone)",
            "Unbearable pain",
            "Simple muscle soreness after exercise"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Visible deformity, a bone piercing the skin, or unbearable pain signal a serious injury requiring immediate medical care; ordinary muscle soreness is not an emergency."
        },
        {
          "question": "Can a sprain and a fracture be easily told apart without an exam?",
          "options": [
            "Yes, it's obvious",
            "No — if in doubt, treat it as a fracture"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Only medical imaging (an X-ray) can confirm the absence of a fracture; without certainty, immobilize and treat it as a fracture as a precaution."
        },
        {
          "question": "Regarding a shoe on a possibly fractured foot, what should you do?",
          "options": [
            "Remove it if it's compressing the foot (risk of swelling)",
            "Remove it by pulling hard if it resists",
            "Check the toes for sensation",
            "Leave it on if it's not causing discomfort"
          ],
          "correctAnswers": [
            0,
            2,
            3
          ],
          "explanation": "A shoe that's too tight can cut off circulation if swelling occurs, but forcibly removing it from a fractured foot worsens the pain and displacement; the right compromise is to loosen it without forcing and monitor sensation in the toes."
        },
        {
          "question": "Swelling after an injury appears...",
          "options": [
            "Immediately and never later",
            "Sometimes gradually over the following hours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Inflammation following an injury develops over several hours, so the absence of immediate swelling doesn't rule out a fracture."
        },
        {
          "question": "What should be observed when applying an improvised splint?",
          "options": [
            "Stabilize without moving the joint",
            "Check finger/toe sensation after applying it",
            "Tighten it as much as possible for good immobilization",
            "Use a rigid material (a board, stiff cardboard)"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "A splint should stabilize without forcing movement, stay loose enough not to cut off circulation (hence checking sensation), and rely on a rigid support to be effective."
        },
        {
          "question": "Cold mainly reduces?",
          "options": [
            "Pain and swelling",
            "The risk of fracture"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Cold narrows local blood vessels (vasoconstriction), which limits inflammation and fluid buildup, thereby reducing pain and swelling."
        },
        {
          "question": "Should finger/toe sensation be checked after immobilization?",
          "options": [
            "No, it's unnecessary",
            "Yes, to check that circulation isn't cut off"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Immobilization that is too tight can compress nerves and vessels; checking that the person can still feel their fingers or toes allows this risk to be caught in time."
        },
        {
          "question": "What should you do if a spinal fracture is suspected?",
          "options": [
            "Absolutely avoid moving the victim",
            "Sit them up quickly to reassure them",
            "Call for help immediately",
            "Leave them in the position they're in"
          ],
          "correctAnswers": [
            0,
            2,
            3
          ],
          "explanation": "An untimely movement of the spine can worsen or cause a spinal cord injury; the victim should therefore be kept still in their position and help trained in safe lifting techniques should be called."
        },
        {
          "question": "The recommended duration for applying cold is?",
          "options": [
            "15-20 minutes",
            "2 hours continuously"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "This duration is enough to achieve the anti-inflammatory effect of cold without causing tissue damage from the cold itself (frostbite)."
        }
      ]
    }
  },
  {
    "id": "rcp",
    "order": 6,
    "icon": "heart-pulse",
    "color": "#C0392B",
    "difficulty": "Difficile",
    "image": "https://images.unsplash.com/photo-1755548376576-e045f6e01773?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Réanimation Cardio-Pulmonaire",
      "description": "Réagir face à un arrêt cardiaque",
      "steps": [
        {
          "title": "Vérifiez la conscience",
          "substeps": [
            "Secouez les épaules",
            "Demandez fort \"Tout va bien ?\"",
            "Pas de réponse = inconscient"
          ]
        },
        {
          "title": "Vérifiez la respiration",
          "substeps": [
            "Basculez la tête",
            "Regardez/écoutez/sentez 10 secondes max",
            "Absence ou gasps = urgence vitale"
          ]
        },
        {
          "title": "Alertez le 185",
          "substeps": [
            "Appelez ou faites appeler immédiatement",
            "Demandez un défibrillateur (DAE) si disponible"
          ]
        },
        {
          "title": "Débutez les compressions",
          "substeps": [
            "Talon de la main au centre du thorax",
            "Mains superposées, bras tendus",
            "30 compressions à 100-120/min, profondeur 5-6cm"
          ]
        },
        {
          "title": "Alternez si formé",
          "substeps": [
            "Si formé aux insufflations : 30 compressions puis 2 insufflations",
            "Sinon : compressions seules en continu, sans pause"
          ]
        },
        {
          "title": "Utilisez le DAE dès disponible",
          "substeps": [
            "Allumez-le",
            "Suivez les instructions vocales",
            "Ne touchez pas la victime pendant l'analyse/le choc"
          ]
        },
        {
          "title": "Continuez",
          "substeps": [
            "Poursuivez jusqu'à reprise de la respiration, arrivée des secours, ou épuisement (relayez si possible)"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Combien de compressions avant les insufflations ?",
          "options": [
            "10",
            "30",
            "50"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le ratio 30:2 (30 compressions pour 2 insufflations) a été établi car il maximise le temps de compression effective, déterminant pour la survie, tout en assurant un minimum d'apport en oxygène."
        },
        {
          "question": "Quelle fréquence de compressions ?",
          "options": [
            "50-60/min",
            "100-120/min",
            "200/min"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Cette fréquence correspond au rythme qui optimise le débit sanguin généré par les compressions sans épuiser trop vite le secouriste."
        },
        {
          "question": "Où placer les mains ?",
          "options": [
            "Sur le ventre",
            "Au centre du thorax",
            "Sur la gorge"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Comprimer le centre du thorax, au niveau du sternum, permet de comprimer directement le cœur situé juste en dessous pour éjecter le sang vers les organes vitaux."
        },
        {
          "question": "Que faire avant de débuter les compressions ?",
          "options": [
            "Vérifier que la personne ne répond pas et ne respire pas normalement",
            "Alerter le 185 (ou faire alerter)",
            "Chercher le pouls pendant au moins 1 minute",
            "Demander un défibrillateur (DAE) si disponible"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Confirmer l'absence de conscience et de respiration normale, alerter les secours et réclamer un défibrillateur sont les trois réflexes qui doivent précéder les compressions ; chercher longuement le pouls fait perdre un temps précieux et n'est plus recommandé pour un témoin non soignant."
        },
        {
          "question": "Profondeur recommandée des compressions ?",
          "options": [
            "1-2 cm",
            "5-6 cm",
            "10 cm"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une compression de 5 à 6 cm chez l'adulte est nécessaire pour générer une pression suffisante à propulser le sang dans la circulation ; plus superficielle, elle devient inefficace."
        },
        {
          "question": "Que peut faire un témoin non formé face à un arrêt cardiaque ?",
          "options": [
            "Réaliser des compressions thoraciques seules en continu",
            "Utiliser un défibrillateur automatisé externe (DAE)",
            "Réaliser des insufflations bouche-à-bouche obligatoirement",
            "Alerter le 185 et suivre les instructions du régulateur"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Les compressions seules, l'utilisation d'un DAE (conçu pour guider vocalement n'importe quel témoin) et l'alerte des secours sont accessibles sans formation ; les insufflations demandent une technique qu'un témoin non formé n'est pas tenu de maîtriser."
        },
        {
          "question": "Faut-il vérifier le pouls avant de commencer ?",
          "options": [
            "Oui c'est indispensable",
            "Non, ne pas perdre de temps à chercher le pouls"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Chercher un pouls est difficile et prend du temps même pour un professionnel ; un témoin ne doit pas perdre de précieuses secondes à cette recherche incertaine avant de débuter les compressions."
        },
        {
          "question": "Que faire pendant l'analyse du défibrillateur (DAE) ?",
          "options": [
            "Continuer les compressions",
            "Ne toucher à aucun moment la victime"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Tout mouvement pendant l'analyse peut fausser la détection du rythme cardiaque par l'appareil, qui doit rester immobile sur la victime pour évaluer correctement s'il faut délivrer un choc."
        },
        {
          "question": "Jusqu'à quand poursuivre la RCP ?",
          "options": [
            "2 minutes maximum",
            "Jusqu'aux secours ou reprise de la respiration"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un arrêt cardiaque non traité est fatal en quelques minutes ; les compressions doivent continuer sans interruption prolongée jusqu'à la prise en charge par les secours ou la reprise d'une respiration normale."
        },
        {
          "question": "Le DAE peut-il être utilisé par un témoin non médecin ?",
          "options": [
            "Non c'est interdit",
            "Oui, il est conçu pour être utilisé par tous"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le défibrillateur automatisé externe analyse lui-même le rythme cardiaque et ne délivre un choc que si nécessaire, ce qui le rend sûr et simple d'utilisation pour n'importe quel témoin, formé ou non."
        },
        {
          "question": "Que faire à plusieurs secouristes lors d'une RCP prolongée ?",
          "options": [
            "Se relayer toutes les 2 minutes environ pour garder des compressions efficaces",
            "Laisser un seul secouriste agir seul jusqu'à épuisement",
            "Un se charge d'alerter/chercher le DAE pendant que l'autre compresse",
            "Arrêter les compressions dès qu'un relais est disponible, même quelques secondes"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "La fatigue réduit rapidement la profondeur des compressions ; se relayer régulièrement et répartir les tâches (alerte, DAE, compressions) maintient une RCP efficace sans interrompre inutilement le massage cardiaque."
        },
        {
          "question": "Lésions cérébrales possibles après combien de temps sans RCP ?",
          "options": [
            "Dès 3 minutes environ",
            "Après 30 minutes"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Le cerveau est extrêmement sensible au manque d'oxygène ; au-delà de 3 à 5 minutes sans circulation sanguine, des lésions cérébrales irréversibles peuvent déjà survenir."
        },
        {
          "question": "Faut-il déplacer la victime sur une surface dure avant RCP ?",
          "options": [
            "Oui systématiquement même si ça retarde le début",
            "Privilégier de commencer rapidement, sans retard significatif"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Chercher une surface parfaitement dure avant de commencer fait perdre un temps critique ; mieux vaut débuter les compressions rapidement là où se trouve la victime, sauf situation dangereuse."
        },
        {
          "question": "Que faire pendant que le défibrillateur (DAE) analyse le rythme cardiaque ?",
          "options": [
            "Ne toucher à aucun moment la victime",
            "Continuer les compressions pendant l'analyse",
            "Un choc n'est délivré que si l'appareil détecte un rythme choquable",
            "Couper l'appareil si rien ne se passe après 5 secondes"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Tout contact avec la victime pendant l'analyse peut fausser la détection du rythme cardiaque par l'appareil, qui ne délivre un choc que s'il identifie un rythme réellement choquable — il faut donc s'écarter et laisser l'appareil terminer son analyse."
        },
        {
          "question": "Après un choc du DAE, que fait-on ?",
          "options": [
            "On arrête tout et on attend",
            "On reprend immédiatement les compressions"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le choc électrique ne redémarre pas immédiatement une activité cardiaque efficace ; poursuivre les compressions juste après maintient la circulation en attendant que le cœur reprenne un rythme propre."
        },
        {
          "question": "La RCP seule (sans DAE) peut-elle sauver une vie ?",
          "options": [
            "Non c'est inutile sans défibrillateur",
            "Oui, elle maintient une oxygénation vitale en attendant les secours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Même sans défibrillateur, les compressions thoraciques maintiennent une circulation sanguine minimale vers le cerveau et les organes vitaux, ce qui augmente significativement les chances de survie en attendant les secours."
        },
        {
          "question": "Comment vérifier rapidement l'état d'une personne avant la RCP ?",
          "options": [
            "Secouer les épaules et parler fort",
            "Regarder, écouter et sentir la respiration pendant 10 secondes maximum",
            "Attendre 1 minute pour être sûr",
            "Chercher le pouls carotidien pendant 30 secondes"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Stimuler verbalement et physiquement puis observer la respiration pendant 10 secondes maximum permet une évaluation rapide sans retarder l'alerte ; passer plus de temps à cette étape retarde des gestes qui sauvent des vies."
        }
      ]
    },
    "en": {
      "title": "Cardiopulmonary Resuscitation (CPR)",
      "description": "Respond to a cardiac arrest",
      "steps": [
        {
          "title": "Check responsiveness",
          "substeps": [
            "Shake the shoulders",
            "Ask loudly \"Are you okay?\"",
            "No response = unconscious"
          ]
        },
        {
          "title": "Check breathing",
          "substeps": [
            "Tilt the head back",
            "Look, listen, and feel for up to 10 seconds",
            "No breathing or gasping = life-threatening emergency"
          ]
        },
        {
          "title": "Call 185",
          "substeps": [
            "Call or have someone call immediately",
            "Ask for a defibrillator (AED) if available"
          ]
        },
        {
          "title": "Begin compressions",
          "substeps": [
            "Heel of the hand at the center of the chest",
            "Hands stacked, arms straight",
            "30 compressions at 100-120/min, 5-6 cm deep"
          ]
        },
        {
          "title": "Alternate if trained",
          "substeps": [
            "If trained in rescue breaths: 30 compressions then 2 breaths",
            "Otherwise: compressions only, continuously, without pausing"
          ]
        },
        {
          "title": "Use the AED as soon as it's available",
          "substeps": [
            "Turn it on",
            "Follow the voice instructions",
            "Don't touch the victim during analysis/the shock"
          ]
        },
        {
          "title": "Continue",
          "substeps": [
            "Keep going until breathing resumes, help arrives, or you're exhausted (switch with someone if possible)"
          ]
        }
      ],
      "quiz": [
        {
          "question": "How many compressions before rescue breaths?",
          "options": [
            "10",
            "30",
            "50"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The 30:2 ratio (30 compressions to 2 breaths) was established because it maximizes effective compression time, which is critical for survival, while still providing a minimum amount of oxygen."
        },
        {
          "question": "What compression rate?",
          "options": [
            "50-60/min",
            "100-120/min",
            "200/min"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "This rate matches the pace that optimizes blood flow generated by the compressions without exhausting the rescuer too quickly."
        },
        {
          "question": "Where should you place your hands?",
          "options": [
            "On the abdomen",
            "At the center of the chest",
            "On the throat"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Compressing the center of the chest, at the sternum, directly compresses the heart located just beneath it to push blood toward the vital organs."
        },
        {
          "question": "What should you do before starting compressions?",
          "options": [
            "Check that the person isn't responding and isn't breathing normally",
            "Call 185 (or have someone call)",
            "Feel for a pulse for at least 1 minute",
            "Ask for a defibrillator (AED) if available"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Confirming the absence of consciousness and normal breathing, calling for help, and requesting a defibrillator are the three actions that should come before compressions; spending a long time checking for a pulse wastes precious time and is no longer recommended for a non-medical bystander."
        },
        {
          "question": "Recommended compression depth?",
          "options": [
            "1-2 cm",
            "5-6 cm",
            "10 cm"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A compression of 5 to 6 cm in an adult is needed to generate enough pressure to push blood through circulation; shallower compressions become ineffective."
        },
        {
          "question": "What can an untrained bystander do in the face of a cardiac arrest?",
          "options": [
            "Perform continuous chest compressions only",
            "Use an automated external defibrillator (AED)",
            "Perform mouth-to-mouth breaths as a requirement",
            "Call 185 and follow the dispatcher's instructions"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Compressions alone, using an AED (designed to guide any bystander with voice instructions), and calling for help are all accessible without training; rescue breaths require a technique that an untrained bystander is not expected to master."
        },
        {
          "question": "Should you check for a pulse before starting?",
          "options": [
            "Yes, it's essential",
            "No, do not waste time looking for a pulse"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Finding a pulse is difficult and time-consuming even for a professional; a bystander should not waste precious seconds on this uncertain search before starting compressions."
        },
        {
          "question": "What should you do while the defibrillator (AED) is analyzing?",
          "options": [
            "Continue compressions",
            "Don't touch the victim at all"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Any movement during the analysis can distort the device's detection of the heart rhythm, which must remain still on the victim to correctly assess whether a shock is needed."
        },
        {
          "question": "Until when should CPR continue?",
          "options": [
            "2 minutes maximum",
            "Until help arrives or breathing resumes"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "An untreated cardiac arrest is fatal within minutes; compressions must continue without prolonged interruption until emergency responders take over or normal breathing resumes."
        },
        {
          "question": "Can the AED be used by a bystander who isn't a doctor?",
          "options": [
            "No, it's forbidden",
            "Yes, it's designed to be used by anyone"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The automated external defibrillator analyzes the heart rhythm itself and only delivers a shock if necessary, which makes it safe and simple to use for any bystander, trained or not."
        },
        {
          "question": "What should multiple rescuers do during prolonged CPR?",
          "options": [
            "Switch off roughly every 2 minutes to keep compressions effective",
            "Let a single rescuer act alone until exhausted",
            "Have one person call for help/get the AED while the other compresses",
            "Stop compressions as soon as a replacement is available, even for a few seconds"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Fatigue quickly reduces compression depth; switching off regularly and dividing tasks (calling for help, the AED, compressions) keeps CPR effective without needlessly interrupting chest compressions."
        },
        {
          "question": "Brain damage is possible after how long without CPR?",
          "options": [
            "As early as around 3 minutes",
            "After 30 minutes"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "The brain is extremely sensitive to a lack of oxygen; beyond 3 to 5 minutes without blood circulation, irreversible brain damage can already occur."
        },
        {
          "question": "Should the victim be moved onto a hard surface before CPR?",
          "options": [
            "Yes, always, even if it delays starting",
            "Prioritize starting quickly, without significant delay"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Looking for a perfectly hard surface before starting wastes critical time; it is better to start compressions quickly wherever the victim is, unless the situation is dangerous."
        },
        {
          "question": "What should you do while the defibrillator (AED) analyzes the heart rhythm?",
          "options": [
            "Don't touch the victim at all",
            "Continue compressions during the analysis",
            "A shock is only delivered if the device detects a shockable rhythm",
            "Turn off the device if nothing happens after 5 seconds"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Any contact with the victim during the analysis can distort the device's heart rhythm detection, and it only delivers a shock if it identifies a genuinely shockable rhythm — so step back and let the device finish its analysis."
        },
        {
          "question": "After an AED shock, what do you do?",
          "options": [
            "You stop everything and wait",
            "You immediately resume compressions"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The electric shock doesn't immediately restore effective heart activity; continuing compressions right after maintains circulation while the heart works to regain a proper rhythm."
        },
        {
          "question": "Can CPR alone (without an AED) save a life?",
          "options": [
            "No, it's useless without a defibrillator",
            "Yes, it maintains vital oxygenation while waiting for help"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Even without a defibrillator, chest compressions maintain minimal blood circulation to the brain and vital organs, which significantly increases the chances of survival while waiting for help."
        },
        {
          "question": "How do you quickly check a person's condition before CPR?",
          "options": [
            "Shake the shoulders and speak loudly",
            "Look, listen, and feel for breathing for up to 10 seconds",
            "Wait 1 minute to be sure",
            "Feel for a carotid pulse for 30 seconds"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Stimulating the person verbally and physically, then observing breathing for up to 10 seconds, allows for a quick assessment without delaying the alert; spending more time on this step delays life-saving actions."
        }
      ]
    }
  },
  {
    "id": "avc",
    "order": 7,
    "icon": "brain",
    "color": "#8E44AD",
    "difficulty": "Difficile",
    "image": "https://images.pexels.com/photos/20100296/pexels-photo-20100296.jpeg?auto=compress&cs=tinysrgb&w=600",
    "fr": {
      "title": "Reconnaître un AVC",
      "description": "Identifier rapidement un accident vasculaire cérébral (méthode FAST)",
      "steps": [
        {
          "title": "F - Face (Visage)",
          "substeps": [
            "Demandez à la personne de sourire",
            "Un côté du visage tombe-t-il ou semble-t-il asymétrique ?"
          ]
        },
        {
          "title": "A - Arm (Bras)",
          "substeps": [
            "Demandez de lever les deux bras simultanément",
            "Un bras retombe-t-il ou reste-t-il faible ?"
          ]
        },
        {
          "title": "S - Speech (Parole)",
          "substeps": [
            "Demandez de répéter une phrase simple",
            "La parole est-elle confuse, déformée, ou les mots manquent ?"
          ]
        },
        {
          "title": "T - Time (Temps)",
          "substeps": [
            "Si un seul de ces signes est présent, c'est une urgence : chaque minute compte pour le cerveau"
          ]
        },
        {
          "title": "Alertez immédiatement",
          "substeps": [
            "Appelez le 185 sans attendre, même si les signes s'améliorent ou disparaissent"
          ]
        },
        {
          "title": "Installez confortablement",
          "substeps": [
            "Aidez à s'asseoir ou s'allonger",
            "Si troubles de conscience, position latérale de sécurité"
          ]
        },
        {
          "title": "Notez l'heure",
          "substeps": [
            "Notez précisément l'heure d'apparition des premiers symptômes - information cruciale pour le traitement"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Quels sont les signes d'un AVC (méthode FAST) ?",
          "options": [
            "Visage qui tombe d'un côté (asymétrie)",
            "Un bras qui retombe ou reste faible",
            "Difficulté à parler ou parole déformée",
            "Fièvre élevée"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Le visage asymétrique, la faiblesse d'un bras et les troubles de la parole traduisent chacun un déficit neurologique localisé, typique d'une atteinte cérébrale ; la fièvre n'est pas un signe d'AVC mais évoque plutôt une infection."
        },
        {
          "question": "Que faire si un seul signe est présent ?",
          "options": [
            "Attendre pour voir si ça passe",
            "Appeler le 185 immédiatement"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un seul signe FAST suffit à déclencher l'urgence car retarder l'appel en attendant d'autres symptômes fait perdre un temps précieux pour le traitement du cerveau."
        },
        {
          "question": "Que signifie le \"T\" de FAST ?",
          "options": [
            "Température",
            "Time (temps) - chaque minute compte"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Chaque minute sans traitement, environ 2 millions de neurones meurent faute d'oxygène ; c'est pourquoi le temps est un facteur pronostique majeur dans l'AVC."
        },
        {
          "question": "Si les symptômes disparaissent après quelques minutes ?",
          "options": [
            "Tout va bien, pas besoin d'appeler",
            "Appeler quand même, risque de récidive grave"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une disparition rapide des signes peut correspondre à un accident ischémique transitoire (AIT), un signal d'alarme fort annonçant un risque élevé de récidive sous forme d'AVC complet dans les heures ou jours suivants."
        },
        {
          "question": "Pourquoi est-il essentiel de noter l'heure d'apparition des premiers symptômes d'un AVC ?",
          "options": [
            "Pour la paperasse administrative",
            "Pour déterminer si un traitement par thrombolyse est encore possible",
            "Parce que certains traitements ont une fenêtre d'action limitée dans le temps",
            "Pour remplir le carnet de santé plus tard"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "Les traitements qui dissolvent le caillot (thrombolyse) ou le retirent (thrombectomie) ne sont efficaces et sûrs que dans une fenêtre de temps limitée après le début des symptômes ; connaître l'heure exacte conditionne les options thérapeutiques possibles à l'hôpital."
        },
        {
          "question": "Quelle position si la personne perd connaissance ?",
          "options": [
            "Position latérale de sécurité",
            "Position assise stricte"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "La position latérale de sécurité protège les voies respiratoires d'une personne inconsciente en cas de vomissement, comme pour toute perte de connaissance."
        },
        {
          "question": "Concernant l'âge des personnes touchées par un AVC :",
          "options": [
            "Cela touche uniquement les personnes âgées",
            "Cela peut toucher un adulte jeune, même si c'est plus rare",
            "Le risque augmente avec l'âge et les facteurs cardiovasculaires",
            "Les enfants ne peuvent jamais être concernés"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "Si le risque d'AVC augmente avec l'âge et des facteurs comme l'hypertension ou le tabac, un accident vasculaire cérébral peut malgré tout survenir chez un adulte jeune, notamment en cas de malformation vasculaire ou de trouble de la coagulation."
        },
        {
          "question": "Faut-il donner un médicament (aspirine) en attendant ?",
          "options": [
            "Oui pour fluidifier le sang",
            "Non, ne rien donner, certains AVC sont hémorragiques"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Certains AVC sont dus à une hémorragie cérébrale ; un médicament qui fluidifie le sang comme l'aspirine aggraverait alors le saignement au lieu d'aider."
        },
        {
          "question": "Le délai optimal pour un traitement par thrombolyse est ?",
          "options": [
            "Dans les 4h30 suivant les premiers signes",
            "Dans les 24 heures sans urgence"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Passé ce délai, le risque de transformer une zone cérébrale simplement en souffrance en lésion hémorragique par le traitement devient trop important par rapport au bénéfice attendu."
        },
        {
          "question": "Concernant les signes d'un AVC, que faut-il savoir ?",
          "options": [
            "Les 3 signes FAST sont toujours présents ensemble",
            "Un seul signe FAST suffit à faire suspecter un AVC",
            "Les symptômes peuvent apparaître brutalement",
            "Ils touchent uniquement le côté droit du corps"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "Un AVC peut ne provoquer qu'un seul des trois signes FAST, et son installation est typiquement brutale ; il peut toucher indifféremment le côté droit ou gauche du corps selon la zone cérébrale atteinte."
        },
        {
          "question": "Un mini-AVC (AIT) qui régresse seul nécessite-t-il une consultation ?",
          "options": [
            "Non si ça va mieux",
            "Oui, urgence identique car risque de récidive"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un AIT signale que le mécanisme capable de provoquer un AVC complet est déjà à l'œuvre ; le risque de récidive grave dans les jours suivants justifie une évaluation en urgence, même si tout est rentré dans l'ordre."
        },
        {
          "question": "Quel numéro appeler en priorité en cas de suspicion d'AVC ?",
          "options": [
            "Le médecin traitant pour rendez-vous",
            "Le 185 (SAMU) directement"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le 185 mobilise directement une équipe capable d'orienter vers une unité spécialisée (unité neurovasculaire) sans perdre de temps, contrairement à un rendez-vous médical classique."
        },
        {
          "question": "Quels symptômes neurologiques soudains peuvent faire penser à un AVC, au-delà de FAST ?",
          "options": [
            "Un mal de tête brutal et très intense",
            "Des vertiges ou pertes d'équilibre soudains",
            "Une fatigue progressive après une longue journée",
            "Un engourdissement soudain d'un côté du corps"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Un mal de tête soudain et violent, des vertiges brutaux ou un engourdissement unilatéral traduisent une atteinte neurologique aiguë typique d'un AVC ; une fatigue qui s'installe progressivement en fin de journée est un phénomène banal sans rapport."
        },
        {
          "question": "Faut-il faire boire ou manger la personne en attendant les secours ?",
          "options": [
            "Oui pour la réconforter",
            "Non, risque de fausse route si troubles de la déglutition"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un AVC peut altérer les muscles de la déglutition sans que cela soit visible immédiatement ; avaler expose alors à un passage de liquide ou d'aliment dans les voies respiratoires."
        },
        {
          "question": "Les troubles de la vision peuvent-ils signaler un AVC ?",
          "options": [
            "Non, sans rapport",
            "Oui, vision trouble ou perte de vision soudaine"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une perte de vision brutale ou une vision double peut traduire l'atteinte d'une zone du cerveau dédiée à la vision, un mécanisme identique à celui des autres signes de l'AVC."
        },
        {
          "question": "Un AVC peut être causé par :",
          "options": [
            "Une artère cérébrale bouchée (AVC ischémique)",
            "Un vaisseau cérébral qui se rompt et saigne (AVC hémorragique)",
            "Une infection virale du cerveau",
            "Une insolation prolongée"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Les deux mécanismes reconnus de l'AVC sont l'obstruction d'une artère cérébrale, qui prive une zone du cerveau d'oxygène, et la rupture d'un vaisseau qui provoque un saignement intracérébral — l'infection virale ou l'insolation ne sont pas des causes d'AVC."
        },
        {
          "question": "Doit-on essayer de faire marcher la personne pour \"voir si ça va\" ?",
          "options": [
            "Oui pour évaluer",
            "Non, limiter les mouvements et alerter directement"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Faire marcher la personne pour 'tester' expose à une chute si l'équilibre ou la force sont déjà atteints, et ne fait que retarder l'appel aux secours."
        },
        {
          "question": "Les femmes victimes d'un AVC peuvent présenter des symptômes moins typiques. Lesquels ?",
          "options": [
            "Confusion inhabituelle",
            "Fatigue soudaine et intense",
            "Toujours exactement les mêmes signes FAST que les hommes, sans exception",
            "Nausées ou douleurs inhabituelles"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "En plus des signes FAST classiques, les femmes présentent parfois des symptômes plus atypiques (confusion, fatigue soudaine, nausées) qui peuvent retarder le diagnostic si on s'attend uniquement aux signes typiques."
        },
        {
          "question": "Combien de temps maximum pour la thrombectomie mécanique chez certains patients ?",
          "options": [
            "Jusqu'à 24h dans certains cas",
            "Seulement dans la première heure"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Contrairement à la thrombolyse, la thrombectomie mécanique (retrait physique du caillot) peut être proposée à certains patients sélectionnés par imagerie jusqu'à 24 heures après le début des symptômes."
        },
        {
          "question": "Un AVC est-il une urgence qui se traite \"à tête reposée\" ?",
          "options": [
            "Non, c'est une urgence vitale immédiate",
            "Oui on peut attendre le lendemain"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Comme pour un infarctus du cœur, chaque minute sans traitement aggrave les séquelles définitives ; un AVC se traite dans l'instant, jamais 'à tête reposée'."
        }
      ]
    },
    "en": {
      "title": "Recognizing a Stroke",
      "description": "Quickly identify a stroke (FAST method)",
      "steps": [
        {
          "title": "F - Face",
          "substeps": [
            "Ask the person to smile",
            "Does one side of the face droop or look asymmetrical?"
          ]
        },
        {
          "title": "A - Arms",
          "substeps": [
            "Ask them to raise both arms at the same time",
            "Does one arm drift downward or stay weak?"
          ]
        },
        {
          "title": "S - Speech",
          "substeps": [
            "Ask them to repeat a simple sentence",
            "Is their speech slurred, distorted, or are they struggling to find words?"
          ]
        },
        {
          "title": "T - Time",
          "substeps": [
            "If even one of these signs is present, it's an emergency: every minute counts for the brain"
          ]
        },
        {
          "title": "Call for help immediately",
          "substeps": [
            "Call 185 without waiting, even if the signs improve or disappear"
          ]
        },
        {
          "title": "Make them comfortable",
          "substeps": [
            "Help them sit or lie down",
            "If consciousness is impaired, use the recovery position"
          ]
        },
        {
          "title": "Note the time",
          "substeps": [
            "Note the exact time the first symptoms appeared — crucial information for treatment"
          ]
        }
      ],
      "quiz": [
        {
          "question": "What are the signs of a stroke (FAST method)?",
          "options": [
            "Face drooping on one side (asymmetry)",
            "An arm that drifts down or stays weak",
            "Difficulty speaking or slurred speech",
            "High fever"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Facial asymmetry, arm weakness, and speech problems each reflect a localized neurological deficit typical of brain injury; fever is not a sign of stroke but rather suggests an infection."
        },
        {
          "question": "What should you do if only one sign is present?",
          "options": [
            "Wait to see if it passes",
            "Call 185 immediately"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A single FAST sign is enough to trigger the emergency response, because delaying the call while waiting for other symptoms wastes precious time for treating the brain."
        },
        {
          "question": "What does the \"T\" in FAST stand for?",
          "options": [
            "Temperature",
            "Time — every minute counts"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Every minute without treatment, about 2 million neurons die from lack of oxygen; this is why time is a major prognostic factor in stroke."
        },
        {
          "question": "If symptoms disappear after a few minutes?",
          "options": [
            "Everything's fine, no need to call",
            "Call anyway — risk of a serious recurrence"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A quick disappearance of signs may indicate a transient ischemic attack (TIA), a strong warning sign of a high risk of a full stroke occurring in the following hours or days."
        },
        {
          "question": "Why is it essential to note the time the first stroke symptoms appeared?",
          "options": [
            "For administrative paperwork",
            "To determine whether thrombolysis treatment is still possible",
            "Because some treatments have a limited time window",
            "To fill in the health record later"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "Treatments that dissolve the clot (thrombolysis) or remove it (thrombectomy) are only effective and safe within a limited time window after symptoms start; knowing the exact time determines the treatment options available at the hospital."
        },
        {
          "question": "Which position if the person loses consciousness?",
          "options": [
            "Recovery position",
            "Strictly seated position"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "The recovery position protects an unconscious person's airway in case of vomiting, as with any loss of consciousness."
        },
        {
          "question": "Regarding the age of people affected by strokes:",
          "options": [
            "It only affects older people",
            "It can affect a young adult, even though it's rarer",
            "The risk increases with age and cardiovascular risk factors",
            "Children can never be affected"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "While stroke risk increases with age and factors like hypertension or smoking, a stroke can still occur in a young adult, particularly in cases of vascular malformation or a clotting disorder."
        },
        {
          "question": "Should you give a medication (aspirin) while waiting?",
          "options": [
            "Yes, to thin the blood",
            "No, do not give anything — some strokes are hemorrhagic"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Some strokes are caused by a brain hemorrhage; a blood-thinning medication like aspirin would worsen the bleeding instead of helping."
        },
        {
          "question": "The optimal window for thrombolysis treatment is?",
          "options": [
            "Within 4.5 hours of the first signs",
            "Within 24 hours, no rush"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Beyond this window, the risk of the treatment turning a merely distressed brain area into a hemorrhagic lesion becomes too high relative to the expected benefit."
        },
        {
          "question": "Regarding the signs of a stroke, what should you know?",
          "options": [
            "All 3 FAST signs are always present together",
            "A single FAST sign is enough to suspect a stroke",
            "Symptoms can appear suddenly",
            "They only affect the right side of the body"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "A stroke may cause only one of the three FAST signs, and its onset is typically sudden; it can affect either the right or left side of the body depending on which part of the brain is affected."
        },
        {
          "question": "Does a mini-stroke (TIA) that resolves on its own need medical attention?",
          "options": [
            "No, if it's improving",
            "Yes, it's just as urgent because of the risk of recurrence"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A TIA signals that the mechanism capable of causing a full stroke is already at work; the risk of a serious recurrence in the following days justifies an emergency evaluation, even if everything has returned to normal."
        },
        {
          "question": "Which number should you call first if a stroke is suspected?",
          "options": [
            "Your regular doctor for an appointment",
            "185 (SAMU) directly"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Calling 185 directly mobilizes a team able to route the patient to a specialized unit (a stroke unit) without wasting time, unlike a regular medical appointment."
        },
        {
          "question": "Which sudden neurological symptoms can suggest a stroke, beyond FAST?",
          "options": [
            "A sudden, very intense headache",
            "Sudden dizziness or loss of balance",
            "Gradual tiredness after a long day",
            "Sudden numbness on one side of the body"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "A sudden, severe headache, sudden dizziness, or numbness on one side reflect an acute neurological event typical of a stroke; tiredness that builds gradually by the end of the day is an ordinary, unrelated occurrence."
        },
        {
          "question": "Should the person be given food or drink while waiting for help?",
          "options": [
            "Yes, to comfort them",
            "No — risk of choking if swallowing is impaired"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A stroke can affect the swallowing muscles without this being immediately obvious; swallowing then risks liquid or food entering the airway."
        },
        {
          "question": "Can vision problems signal a stroke?",
          "options": [
            "No, unrelated",
            "Yes, blurred vision or sudden vision loss"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Sudden vision loss or double vision can reflect damage to a brain area dedicated to vision, the same mechanism as the other signs of stroke."
        },
        {
          "question": "A stroke can be caused by:",
          "options": [
            "A blocked brain artery (ischemic stroke)",
            "A brain vessel that ruptures and bleeds (hemorrhagic stroke)",
            "A viral infection of the brain",
            "Prolonged sun exposure (heatstroke)"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "The two recognized mechanisms of stroke are the blockage of a brain artery, which deprives an area of the brain of oxygen, and the rupture of a vessel causing intracranial bleeding — a viral infection or heatstroke are not causes of stroke."
        },
        {
          "question": "Should you try to make the person walk to \"see if they're okay\"?",
          "options": [
            "Yes, to assess them",
            "No, limit movement and call for help directly"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Making the person walk to 'test' them risks a fall if balance or strength are already affected, and only delays calling for help."
        },
        {
          "question": "Women having a stroke can present less typical symptoms. Which ones?",
          "options": [
            "Unusual confusion",
            "Sudden, intense fatigue",
            "Always exactly the same FAST signs as men, without exception",
            "Unusual nausea or pain"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "In addition to the classic FAST signs, women sometimes present more atypical symptoms (confusion, sudden fatigue, nausea) that can delay diagnosis if only the typical signs are expected."
        },
        {
          "question": "What's the maximum time window for mechanical thrombectomy in certain patients?",
          "options": [
            "Up to 24 hours in certain cases",
            "Only within the first hour"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Unlike thrombolysis, mechanical thrombectomy (physically removing the clot) can be offered to certain patients selected via imaging up to 24 hours after symptom onset."
        },
        {
          "question": "Is a stroke an emergency that can be treated \"whenever convenient\"?",
          "options": [
            "No, it's an immediate life-threatening emergency",
            "Yes, it can wait until the next day"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "As with a heart attack, every minute without treatment worsens the permanent damage; a stroke is treated immediately, never 'whenever convenient'."
        }
      ]
    }
  },
  {
    "id": "malaise-cardiaque",
    "order": 8,
    "icon": "heart-crack",
    "color": "#C0392B",
    "difficulty": "Difficile",
    "image": "https://images.pexels.com/photos/20100296/pexels-photo-20100296.jpeg?auto=compress&cs=tinysrgb&w=600",
    "fr": {
      "title": "Malaise Cardiaque",
      "description": "Réagir face à une douleur thoracique évocatrice",
      "steps": [
        {
          "title": "Reconnaître les signes",
          "substeps": [
            "Douleur thoracique intense et oppressante",
            "Irradiant vers le bras gauche/mâchoire/dos",
            "Sueurs",
            "Essoufflement"
          ]
        },
        {
          "title": "Installez confortablement",
          "substeps": [
            "Asseyez la personne en position semi-assise",
            "Desserrez les vêtements serrés"
          ]
        },
        {
          "title": "Alertez le 185 immédiatement",
          "substeps": [
            "Appelez sans délai",
            "Décrivez précisément les symptômes au médecin régulateur"
          ]
        },
        {
          "title": "Ne laissez jamais seule",
          "substeps": [
            "Restez auprès de la victime",
            "Rassurez-la",
            "Limitez ses efforts et mouvements"
          ]
        },
        {
          "title": "Si arrêt cardiaque survient",
          "substeps": [
            "Si perte de conscience et absence de respiration normale, débutez immédiatement la RCP"
          ]
        },
        {
          "title": "Préparez l'arrivée des secours",
          "substeps": [
            "Si possible, ayez les médicaments habituels de la personne à disposition pour les secours"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Comment positionner une personne victime d'un malaise cardiaque ?",
          "options": [
            "Position semi-assise",
            "Complètement allongée à plat",
            "Jambes surélevées",
            "Assise, dos calé et soutenu"
          ],
          "correctAnswers": [
            0,
            3
          ],
          "explanation": "La position semi-assise, dos calé, réduit le retour veineux vers le cœur et facilite la respiration ; à plat ou jambes surélevées, le retour veineux augmente et alourdit le travail cardiaque."
        },
        {
          "question": "Faut-il laisser la personne seule ?",
          "options": [
            "Oui pour aller chercher de l'aide",
            "Non, jamais"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une aggravation (perte de connaissance, arrêt cardiaque) peut survenir à tout moment ; rester permet d'intervenir immédiatement."
        },
        {
          "question": "Vers où la douleur d'un malaise cardiaque peut-elle irradier ?",
          "options": [
            "Le bras gauche",
            "La mâchoire",
            "Le dos",
            "Les orteils"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "La douleur cardiaque suit des trajets nerveux partagés avec le bras gauche, la mâchoire et le dos, contrairement aux orteils qui ne sont jamais concernés par ce type d'irradiation."
        },
        {
          "question": "Que faire si la personne perd connaissance et ne respire plus ?",
          "options": [
            "Attendre les secours sans agir",
            "Débuter immédiatement la RCP"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "L'arrêt de la respiration signe un arrêt cardiaque ; seules les compressions thoraciques peuvent maintenir un débit sanguin minimal vers le cerveau."
        },
        {
          "question": "Faut-il desserrer les vêtements ?",
          "options": [
            "Oui pour faciliter la respiration",
            "Non, ne rien toucher"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Desserrer col, cravate ou ceinture facilite l'expansion de la cage thoracique et réduit la sensation d'oppression ressentie."
        },
        {
          "question": "La douleur d'un malaise cardiaque est-elle toujours la même chez tout le monde ?",
          "options": [
            "Oui, toujours très intense et identique",
            "Elle peut être diffuse ou modérée selon les personnes",
            "Elle peut être absente chez certains patients (diabétiques, personnes âgées)",
            "Elle dure toujours plus d'une heure"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "L'intensité et la présentation de la douleur varient beaucoup selon les personnes, en particulier chez les diabétiques ou les personnes âgées dont la sensibilité à la douleur cardiaque peut être atténuée, ce qui retarde parfois la reconnaissance de l'urgence."
        },
        {
          "question": "Faut-il faire marcher la personne pour \"faire passer\" la douleur ?",
          "options": [
            "Oui un peu d'effort aide",
            "Non, limiter tout effort physique"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Tout effort augmente la demande en oxygène du cœur déjà défaillant, ce qui peut aggraver la lésion en cours."
        },
        {
          "question": "Quels symptômes atypiques peuvent remplacer la douleur thoracique classique, notamment chez la femme ?",
          "options": [
            "Fatigue intense inhabituelle",
            "Nausées",
            "Douleur strictement identique chez tous les patients sans exception",
            "Essoufflement isolé"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Chez la femme en particulier, un malaise cardiaque se manifeste souvent par des signes moins typiques (fatigue, nausées, essoufflement) plutôt que par la douleur thoracique classique, ce qui explique un diagnostic parfois retardé."
        },
        {
          "question": "Quel est le premier réflexe en cas de doute ?",
          "options": [
            "Attendre de voir si ça passe",
            "Appeler le 185 sans tarder"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le temps perdu avant l'appel retarde la reperfusion du muscle cardiaque, qui souffre davantage à chaque minute qui passe."
        },
        {
          "question": "Peut-on donner un médicament cardiaque non prescrit à la personne ?",
          "options": [
            "Oui si ça semble logique",
            "Non, ne jamais donner de médicament sans avis médical"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un médicament inadapté peut interagir dangereusement avec l'état de la personne ou masquer des symptômes utiles au diagnostic médical."
        },
        {
          "question": "Quels signes accompagnent souvent la douleur d'un malaise cardiaque ?",
          "options": [
            "Sueurs froides",
            "Essoufflement",
            "Une soif intense",
            "Une sensation d'oppression dans la poitrine"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Sueurs froides, essoufflement et sensation d'oppression thoracique traduisent la souffrance du muscle cardiaque et la réaction du système nerveux autonome ; la soif n'est pas un signe caractéristique."
        },
        {
          "question": "Combien de temps peut durer un malaise cardiaque avant complication grave ?",
          "options": [
            "Cela peut évoluer très rapidement, chaque minute compte",
            "On a plusieurs heures sans risque"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "L'évolution peut être très rapide (arrêt cardiaque en quelques minutes), d'où l'urgence absolue d'agir sans attendre."
        },
        {
          "question": "Faut-il noter l'heure de début des symptômes ?",
          "options": [
            "Non inutile",
            "Oui, information importante pour les secours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "L'heure de début conditionne les traitements de désobstruction coronaire possibles à l'hôpital, tout comme pour l'AVC."
        },
        {
          "question": "Si les symptômes s'arrêtent rapidement, faut-il consulter ?",
          "options": [
            "Non plus la peine",
            "Oui, consultation nécessaire même après amélioration"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une amélioration spontanée peut cacher une lésion cardiaque en cours ou un risque de récidive immédiate ; un avis médical reste indispensable."
        },
        {
          "question": "L'essoufflement seul peut-il être un signe de malaise cardiaque ?",
          "options": [
            "Non jamais isolé",
            "Oui, ça peut être un signe associé ou isolé"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Certaines crises cardiaques se manifestent uniquement par un essoufflement, sans douleur thoracique associée, en particulier chez les diabétiques ou les personnes âgées."
        },
        {
          "question": "Quel est le rôle du médecin régulateur du SAMU (185) ?",
          "options": [
            "Il transmet juste l'appel sans intervenir",
            "Il guide les gestes à faire par téléphone",
            "Il organise l'envoi du moyen de secours le plus adapté",
            "Il ne peut rien faire tant que les secours ne sont pas arrivés"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "Le médecin régulateur évalue la situation à distance, donne des instructions précises pour agir en attendant les secours, et décide du moyen (SMUR, ambulance...) le mieux adapté à la gravité annoncée."
        },
        {
          "question": "Faut-il rassurer la victime en attendant les secours ?",
          "options": [
            "Oui, le stress aggrave la situation",
            "Non ce n'est pas utile"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Le stress et l'angoisse augmentent la fréquence cardiaque et la consommation d'oxygène du cœur, ce qui peut aggraver la situation."
        },
        {
          "question": "Une douleur thoracique chez un jeune sportif doit-elle être ignorée ?",
          "options": [
            "Oui car rare chez les jeunes",
            "Non, toute douleur thoracique inhabituelle doit alerter"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Même rare chez les jeunes, une douleur thoracique inhabituelle à l'effort peut révéler une anomalie cardiaque sous-jacente et ne doit jamais être négligée."
        },
        {
          "question": "Quels sont des facteurs de risque cardiovasculaire reconnus ?",
          "options": [
            "Le tabagisme",
            "L'hypertension artérielle",
            "Boire beaucoup d'eau",
            "Le diabète"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Tabac, hypertension et diabète abîment progressivement les artères coronaires et favorisent la formation de caillots ; bien s'hydrater n'a aucun effet protecteur ni aggravant reconnu sur le risque cardiovasculaire."
        },
        {
          "question": "Doit-on continuer une activité physique en cours si la douleur apparaît ?",
          "options": [
            "Non, arrêter immédiatement tout effort",
            "Oui terminer l'effort puis se reposer"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Poursuivre l'effort augmente le travail du cœur au moment même où il manque d'oxygène, ce qui peut transformer une ischémie réversible en infarctus constitué."
        }
      ]
    },
    "en": {
      "title": "Heart Attack",
      "description": "Respond to concerning chest pain",
      "steps": [
        {
          "title": "Recognize the signs",
          "substeps": [
            "Intense, crushing chest pain",
            "Radiating to the left arm/jaw/back",
            "Sweating",
            "Shortness of breath"
          ]
        },
        {
          "title": "Make them comfortable",
          "substeps": [
            "Sit the person in a semi-reclined position",
            "Loosen tight clothing"
          ]
        },
        {
          "title": "Call 185 immediately",
          "substeps": [
            "Call without delay",
            "Describe the symptoms precisely to the dispatch physician"
          ]
        },
        {
          "title": "Never leave them alone",
          "substeps": [
            "Stay with the victim",
            "Reassure them",
            "Limit their exertion and movement"
          ]
        },
        {
          "title": "If cardiac arrest occurs",
          "substeps": [
            "If they lose consciousness and stop breathing normally, begin CPR immediately"
          ]
        },
        {
          "title": "Prepare for the arrival of help",
          "substeps": [
            "If possible, have the person's regular medications ready for the responders"
          ]
        }
      ],
      "quiz": [
        {
          "question": "How should you position someone having a heart attack?",
          "options": [
            "Semi-reclined position",
            "Lying completely flat",
            "Legs elevated",
            "Sitting, with the back propped and supported"
          ],
          "correctAnswers": [
            0,
            3
          ],
          "explanation": "The semi-reclined position, with the back propped up, reduces venous return to the heart and eases breathing; lying flat or with legs elevated increases venous return and adds to the heart's workload."
        },
        {
          "question": "Should you leave the person alone?",
          "options": [
            "Yes, to go get help",
            "No, never"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Worsening (loss of consciousness, cardiac arrest) can happen at any moment; staying allows you to respond immediately."
        },
        {
          "question": "Where can heart attack pain radiate to?",
          "options": [
            "The left arm",
            "The jaw",
            "The back",
            "The toes"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Cardiac pain follows nerve pathways shared with the left arm, jaw, and back, unlike the toes, which are never involved in this type of radiating pain."
        },
        {
          "question": "What should you do if the person loses consciousness and stops breathing?",
          "options": [
            "Wait for help without doing anything",
            "Begin CPR immediately"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Breathing stopping indicates cardiac arrest; only chest compressions can maintain minimal blood flow to the brain."
        },
        {
          "question": "Should clothing be loosened?",
          "options": [
            "Yes, to make breathing easier",
            "No, don't touch anything"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Loosening a collar, tie, or belt makes it easier for the chest to expand and reduces the feeling of tightness."
        },
        {
          "question": "Is heart attack pain always the same for everyone?",
          "options": [
            "Yes, always very intense and identical",
            "It can be diffuse or moderate depending on the person",
            "It can be absent in some patients (diabetics, the elderly)",
            "It always lasts more than an hour"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "The intensity and presentation of the pain vary a lot from person to person, especially in diabetics or the elderly, whose sensitivity to cardiac pain may be reduced, which sometimes delays recognizing the emergency."
        },
        {
          "question": "Should you make the person walk to \"work off\" the pain?",
          "options": [
            "Yes, a bit of exertion helps",
            "No, limit all physical exertion"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Any exertion increases the oxygen demand of an already struggling heart, which can worsen the ongoing damage."
        },
        {
          "question": "Which atypical symptoms can replace classic chest pain, particularly in women?",
          "options": [
            "Unusual, intense fatigue",
            "Nausea",
            "Pain that's strictly identical in all patients without exception",
            "Isolated shortness of breath"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "In women in particular, a heart attack often presents with less typical signs (fatigue, nausea, shortness of breath) rather than classic chest pain, which explains why diagnosis is sometimes delayed."
        },
        {
          "question": "What's the first thing to do if in doubt?",
          "options": [
            "Wait to see if it passes",
            "Call 185 without delay"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Time lost before calling delays reperfusion of the heart muscle, which suffers more with every passing minute."
        },
        {
          "question": "Can you give the person a cardiac medication that wasn't prescribed to them?",
          "options": [
            "Yes, if it seems reasonable",
            "No, never give medication without medical advice"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "An unsuitable medication can interact dangerously with the person's condition or mask symptoms useful for medical diagnosis."
        },
        {
          "question": "Which signs often accompany heart attack pain?",
          "options": [
            "Cold sweats",
            "Shortness of breath",
            "Intense thirst",
            "A feeling of tightness in the chest"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Cold sweats, shortness of breath, and chest tightness reflect the heart muscle's distress and the autonomic nervous system's response; thirst is not a characteristic sign."
        },
        {
          "question": "How long can a heart attack last before a serious complication occurs?",
          "options": [
            "It can progress very quickly — every minute counts",
            "You have several hours with no risk"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "It can progress very quickly (cardiac arrest within minutes), which is why it is absolutely urgent to act without delay."
        },
        {
          "question": "Should you note the time symptoms started?",
          "options": [
            "No, it's unnecessary",
            "Yes, important information for responders"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The start time determines which coronary unblocking treatments are possible at the hospital, just as with stroke."
        },
        {
          "question": "If symptoms stop quickly, should you still see a doctor?",
          "options": [
            "No, it's not necessary anymore",
            "Yes, a medical visit is needed even after improvement"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Spontaneous improvement can hide ongoing heart damage or an immediate risk of recurrence; medical advice remains essential."
        },
        {
          "question": "Can shortness of breath alone be a sign of a heart attack?",
          "options": [
            "No, never on its own",
            "Yes, it can be an associated or isolated sign"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Some heart attacks present only with shortness of breath, without associated chest pain, particularly in diabetics or the elderly."
        },
        {
          "question": "What's the role of the SAMU (185) dispatch physician?",
          "options": [
            "They just pass on the call without intervening",
            "They guide you through what to do over the phone",
            "They arrange for the most appropriate emergency response to be sent",
            "They can't do anything until help arrives"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "The dispatch physician assesses the situation remotely, gives precise instructions on what to do while waiting for help, and decides on the most appropriate response (mobile emergency unit, ambulance...) based on the reported severity."
        },
        {
          "question": "Should you reassure the victim while waiting for help?",
          "options": [
            "Yes, stress worsens the situation",
            "No, it's not useful"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Stress and anxiety increase heart rate and the heart's oxygen consumption, which can worsen the situation."
        },
        {
          "question": "Should chest pain in a young athlete be ignored?",
          "options": [
            "Yes, because it's rare in young people",
            "No, any unusual chest pain should raise concern"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Even though it is rare in young people, unusual chest pain during exertion can reveal an underlying heart condition and should never be dismissed."
        },
        {
          "question": "What are recognized cardiovascular risk factors?",
          "options": [
            "Smoking",
            "High blood pressure",
            "Drinking a lot of water",
            "Diabetes"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "Smoking, high blood pressure, and diabetes progressively damage the coronary arteries and promote clot formation; staying well hydrated has no recognized protective or aggravating effect on cardiovascular risk."
        },
        {
          "question": "Should you continue an ongoing physical activity if pain appears?",
          "options": [
            "No, stop all exertion immediately",
            "Yes, finish the activity then rest"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Continuing to exert yourself increases the heart's workload at the very moment it lacks oxygen, which can turn reversible ischemia into a full heart attack."
        }
      ]
    }
  },
  {
    "id": "allergie",
    "order": 9,
    "icon": "shield-alert",
    "color": "#E67E22",
    "difficulty": "Très difficile",
    "image": "https://images.unsplash.com/photo-1564144573017-8dc932e0039e?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Réaction Allergique Grave",
      "description": "Reconnaître et réagir face à un choc anaphylactique",
      "steps": [
        {
          "title": "Reconnaître les signes",
          "substeps": [
            "Gonflement rapide du visage/lèvres/gorge",
            "Urticaire généralisée",
            "Difficulté à respirer",
            "Chute de tension"
          ]
        },
        {
          "title": "Alertez immédiatement",
          "substeps": [
            "Appelez le 185 dès les premiers signes - c'est une urgence vitale qui évolue très vite"
          ]
        },
        {
          "title": "Position adaptée",
          "substeps": [
            "Allongez sur le dos jambes surélevées",
            "Si difficulté respiratoire : position semi-assise",
            "Si inconscience : PLS"
          ]
        },
        {
          "title": "Auto-injecteur d'épinéphrine",
          "substeps": [
            "Si la personne possède un stylo auto-injecteur, aidez-la à l'utiliser immédiatement dans la cuisse"
          ]
        },
        {
          "title": "Surveillez en continu",
          "substeps": [
            "Restez auprès de la victime",
            "Surveillez conscience et respiration jusqu'aux secours"
          ]
        },
        {
          "title": "Préparez l'allergène en cause",
          "substeps": [
            "Si possible, identifiez la cause (aliment, piqûre, médicament) pour informer les secours"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Quels sont les signes d'un choc anaphylactique ?",
          "options": [
            "Gonflement rapide du visage, des lèvres ou de la gorge",
            "Urticaire généralisée",
            "Difficulté à respirer",
            "Une petite démangeaison locale isolée"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Le gonflement du visage/gorge, l'urticaire généralisée et la difficulté respiratoire traduisent une réaction allergique sévère et généralisée impliquant tout l'organisme, contrairement à une simple démangeaison localisée qui reste une réaction mineure."
        },
        {
          "question": "Est-ce une urgence vitale ?",
          "options": [
            "Oui, appeler immédiatement le 185",
            "Non, ça passe souvent seul"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Un choc anaphylactique peut évoluer vers une détresse respiratoire ou circulatoire fatale en quelques minutes ; l'alerte précoce des secours est déterminante pour la survie."
        },
        {
          "question": "Concernant l'utilisation d'un auto-injecteur d'épinéphrine :",
          "options": [
            "S'injecte dans la cuisse",
            "Peut être utilisé par un témoin non médecin",
            "Ne doit être utilisé que par un médecin",
            "S'injecte dans le bras"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Conçu pour une utilisation simple et rapide, l'auto-injecteur se pique dans la face externe de la cuisse, à travers le vêtement si besoin, et n'importe quel témoin peut l'utiliser sans formation médicale."
        },
        {
          "question": "Quelle position adopter selon l'état de la victime en choc anaphylactique ?",
          "options": [
            "Allongée sur le dos, jambes surélevées si tension basse",
            "Position semi-assise en cas de difficulté respiratoire",
            "Position latérale de sécurité si inconsciente",
            "Toujours debout pour faciliter la respiration"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "La position s'adapte au symptôme dominant : jambes surélevées pour soutenir la tension, semi-assise pour soulager la respiration, ou PLS si la personne perd connaissance — rester debout aggraverait au contraire une chute de tension."
        },
        {
          "question": "Le choc anaphylactique évolue-t-il rapidement ?",
          "options": [
            "Oui, en quelques minutes",
            "Non, sur plusieurs jours"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Les substances libérées lors de la réaction allergique (histamine notamment) agissent en quelques minutes sur les voies respiratoires et les vaisseaux sanguins, d'où une aggravation potentiellement très rapide."
        },
        {
          "question": "Si la personne perd connaissance, quelle position ?",
          "options": [
            "Position latérale de sécurité",
            "Assise"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Comme pour toute perte de connaissance, la PLS protège les voies respiratoires des risques d'inhalation en cas de vomissement."
        },
        {
          "question": "Faut-il attendre pour voir si les symptômes s'aggravent avant d'appeler ?",
          "options": [
            "Oui attendre un peu",
            "Non, appeler dès les premiers signes"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Attendre que les symptômes s'aggravent pour agir retarde l'administration d'un traitement (épinéphrine) qui est d'autant plus efficace qu'il est donné tôt."
        },
        {
          "question": "Un auto-injecteur peut-il être utilisé par un témoin ?",
          "options": [
            "Non seulement par un médecin",
            "Oui, conçu pour être utilisé facilement par tous"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Conçu avec un mécanisme de piqûre automatique et une dose fixe, l'auto-injecteur ne nécessite aucune compétence médicale pour être utilisé correctement."
        },
        {
          "question": "Quelles sont des causes fréquentes de choc anaphylactique ?",
          "options": [
            "Piqûres d'insectes (guêpes, abeilles)",
            "Certains aliments (arachides, fruits de mer...)",
            "Certains médicaments",
            "L'exposition au soleil"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Piqûres d'insectes, aliments et médicaments sont les trois familles de déclencheurs les plus fréquentes d'une réaction allergique sévère chez une personne sensibilisée ; l'exposition solaire seule ne provoque pas de choc anaphylactique."
        },
        {
          "question": "Une deuxième dose d'auto-injecteur peut-elle être nécessaire ?",
          "options": [
            "Non jamais",
            "Oui si pas d'amélioration après quelques minutes et secours pas encore là"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Si les symptômes ne s'améliorent pas après quelques minutes et que les secours ne sont pas encore arrivés, une nouvelle dose peut être nécessaire car l'effet de la première s'estompe."
        },
        {
          "question": "L'urticaire généralisée est-elle un signe à surveiller ?",
          "options": [
            "Oui, signe possible d'allergie sévère",
            "Non sans importance"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Une urticaire qui s'étend rapidement à tout le corps peut annoncer une réaction allergique généralisée en train de s'aggraver."
        },
        {
          "question": "Faut-il identifier la cause probable de l'allergie ?",
          "options": [
            "Non inutile",
            "Oui, utile pour informer les secours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Connaître l'allergène en cause aide les secours à confirmer le diagnostic et à adapter la surveillance et le traitement ultérieur."
        },
        {
          "question": "Le gonflement de la gorge menace-t-il la respiration ?",
          "options": [
            "Oui, risque d'obstruction des voies respiratoires",
            "Non sans lien"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Un gonflement des tissus de la gorge peut rétrécir progressivement le passage de l'air jusqu'à l'obstruer complètement, ce qui en fait un signe de gravité extrême."
        },
        {
          "question": "Face à des signes graves de choc anaphylactique, que privilégier ?",
          "options": [
            "L'auto-injecteur d'épinéphrine sans délai",
            "Un antihistaminique oral en remplacement suffisant",
            "L'appel immédiat au 185",
            "Attendre pour voir si un antihistaminique suffit"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "L'épinéphrine agit en quelques minutes sur les voies respiratoires et la tension artérielle, contrairement à un antihistaminique oral, bien trop lent et insuffisant en cas de signes graves ; l'alerte des secours reste indispensable en parallèle."
        },
        {
          "question": "Une allergie alimentaire peut-elle évoluer en choc anaphylactique ?",
          "options": [
            "Oui, c'est une cause fréquente",
            "Non jamais"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Les aliments (arachides, fruits à coque, fruits de mer...) comptent parmi les déclencheurs les plus courants de choc anaphylactique, en particulier chez l'enfant."
        },
        {
          "question": "Faut-il surveiller la tension/conscience après l'injection d'épinéphrine ?",
          "options": [
            "Non c'est réglé",
            "Oui, continuer la surveillance jusqu'aux secours"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "L'effet de l'épinéphrine est temporaire ; il faut continuer à surveiller la personne pour détecter une réapparition des symptômes une fois l'effet du médicament dissipé."
        },
        {
          "question": "Que faut-il savoir sur l'évolution après une réaction anaphylactique traitée ?",
          "options": [
            "Les symptômes peuvent réapparaître plusieurs heures après (réaction biphasique)",
            "Une surveillance médicale après l'épisode est nécessaire",
            "Une fois l'épinéphrine injectée, aucun risque ne subsiste",
            "La personne peut rentrer chez elle immédiatement sans suivi"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Une deuxième vague de symptômes peut survenir plusieurs heures après la réaction initiale, même sans nouvelle exposition à l'allergène, ce qui justifie une surveillance médicale prolongée après un épisode traité."
        },
        {
          "question": "Une personne allergique connue doit-elle toujours avoir son auto-injecteur sur elle ?",
          "options": [
            "Ce n'est pas nécessaire",
            "Oui, c'est fortement recommandé"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une personne ayant déjà fait une réaction sévère reste à risque de récidive à tout moment ; garder son traitement à portée de main permet une administration immédiate en cas de nouvelle exposition."
        },
        {
          "question": "Le stress peut-il aggraver la perception des symptômes ?",
          "options": [
            "Non sans rapport",
            "Le calme du secouriste aide à rassurer la victime"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Le stress peut accélérer le rythme cardiaque et amplifier la sensation de détresse respiratoire ressentie par la victime ; un secouriste calme aide à limiter cet effet."
        },
        {
          "question": "Quel est le délai d'apparition possible des symptômes après une exposition à l'allergène ?",
          "options": [
            "Toujours instantané, en moins d'une seconde",
            "De quelques minutes à environ 1-2 heures selon les cas",
            "Cela peut varier selon la voie d'exposition (piqûre, aliment, médicament)",
            "Toujours après plus de 24 heures"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "Le délai d'apparition varie de quelques minutes à environ deux heures selon la personne et la voie d'exposition (une piqûre agit en général plus vite qu'un aliment digéré), mais jamais après un délai aussi long que 24 heures."
        }
      ]
    },
    "en": {
      "title": "Severe Allergic Reaction",
      "description": "Recognize and respond to anaphylactic shock",
      "steps": [
        {
          "title": "Recognize the signs",
          "substeps": [
            "Rapid swelling of the face/lips/throat",
            "Widespread hives",
            "Difficulty breathing",
            "Drop in blood pressure"
          ]
        },
        {
          "title": "Call for help immediately",
          "substeps": [
            "Call 185 at the first signs — this is a life-threatening emergency that progresses very quickly"
          ]
        },
        {
          "title": "Appropriate position",
          "substeps": [
            "Lay them on their back with legs raised",
            "If breathing is difficult: semi-reclined position",
            "If unconscious: recovery position"
          ]
        },
        {
          "title": "Epinephrine auto-injector",
          "substeps": [
            "If the person has an auto-injector pen, help them use it immediately in the thigh"
          ]
        },
        {
          "title": "Monitor continuously",
          "substeps": [
            "Stay with the victim",
            "Monitor consciousness and breathing until help arrives"
          ]
        },
        {
          "title": "Identify the allergen involved",
          "substeps": [
            "If possible, identify the cause (food, sting, medication) to inform the responders"
          ]
        }
      ],
      "quiz": [
        {
          "question": "What are the signs of anaphylactic shock?",
          "options": [
            "Rapid swelling of the face, lips, or throat",
            "Widespread hives",
            "Difficulty breathing",
            "A small, isolated local itch"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Swelling of the face/throat, widespread hives, and difficulty breathing indicate a severe, generalized allergic reaction involving the whole body, unlike a simple localized itch, which remains a minor reaction."
        },
        {
          "question": "Is this a life-threatening emergency?",
          "options": [
            "Yes, call 185 immediately",
            "No, it often goes away on its own"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Anaphylactic shock can progress to fatal respiratory or circulatory failure within minutes; calling for help early is crucial for survival."
        },
        {
          "question": "Regarding the use of an epinephrine auto-injector:",
          "options": [
            "It's injected into the thigh",
            "It can be used by a bystander who isn't a doctor",
            "It should only be used by a doctor",
            "It's injected into the arm"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Designed for simple, quick use, the auto-injector is administered into the outer thigh, through clothing if necessary, and any bystander can use it without medical training."
        },
        {
          "question": "Which position should be used depending on the victim's condition during anaphylactic shock?",
          "options": [
            "Lying on the back, legs raised if blood pressure is low",
            "Semi-reclined position if breathing is difficult",
            "Recovery position if unconscious",
            "Always standing, to make breathing easier"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "The position depends on the dominant symptom: legs raised to support blood pressure, semi-reclined to ease breathing, or the recovery position if the person loses consciousness — standing, on the other hand, would worsen a drop in blood pressure."
        },
        {
          "question": "Does anaphylactic shock progress quickly?",
          "options": [
            "Yes, within minutes",
            "No, over several days"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "The substances released during the allergic reaction (histamine in particular) act within minutes on the airways and blood vessels, which is why it can worsen very quickly."
        },
        {
          "question": "If the person loses consciousness, which position?",
          "options": [
            "Recovery position",
            "Seated"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "As with any loss of consciousness, the recovery position protects the airway from the risk of inhaling vomit."
        },
        {
          "question": "Should you wait to see if symptoms worsen before calling?",
          "options": [
            "Yes, wait a little",
            "No, call at the first signs"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Waiting for symptoms to worsen before acting delays giving a treatment (epinephrine) that is all the more effective the earlier it is given."
        },
        {
          "question": "Can an auto-injector be used by a bystander?",
          "options": [
            "No, only by a doctor",
            "Yes, designed to be easily used by anyone"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Designed with an automatic injection mechanism and a fixed dose, the auto-injector requires no medical skill to be used correctly."
        },
        {
          "question": "What are common causes of anaphylactic shock?",
          "options": [
            "Insect stings (wasps, bees)",
            "Certain foods (peanuts, seafood...)",
            "Certain medications",
            "Sun exposure"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Insect stings, foods, and medications are the three most common trigger categories for a severe allergic reaction in a sensitized person; sun exposure alone does not cause anaphylactic shock."
        },
        {
          "question": "Can a second dose of the auto-injector be necessary?",
          "options": [
            "No, never",
            "Yes, if there's no improvement after a few minutes and help hasn't arrived yet"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "If symptoms don't improve after a few minutes and help hasn't arrived yet, a new dose may be needed because the effect of the first one wears off."
        },
        {
          "question": "Is widespread hives a sign to watch for?",
          "options": [
            "Yes, a possible sign of a severe allergy",
            "No, not important"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Hives spreading rapidly across the whole body can signal a generalized allergic reaction that's getting worse."
        },
        {
          "question": "Should you identify the probable cause of the allergy?",
          "options": [
            "No, unnecessary",
            "Yes, useful for informing the responders"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Knowing the allergen involved helps responders confirm the diagnosis and adjust ongoing monitoring and treatment."
        },
        {
          "question": "Does throat swelling threaten breathing?",
          "options": [
            "Yes, risk of airway obstruction",
            "No, unrelated"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Swelling of the throat tissue can progressively narrow the airway until it is completely blocked, which makes it a sign of extreme severity."
        },
        {
          "question": "Faced with severe signs of anaphylactic shock, what should be prioritized?",
          "options": [
            "The epinephrine auto-injector without delay",
            "An oral antihistamine as a sufficient substitute",
            "Calling 185 immediately",
            "Waiting to see if an antihistamine is enough"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Epinephrine acts within minutes on the airways and blood pressure, unlike an oral antihistamine, which is far too slow and insufficient in the case of severe signs; calling for help remains essential alongside it."
        },
        {
          "question": "Can a food allergy progress to anaphylactic shock?",
          "options": [
            "Yes, it's a common cause",
            "No, never"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Foods (peanuts, tree nuts, seafood...) are among the most common triggers of anaphylactic shock, particularly in children."
        },
        {
          "question": "Should blood pressure/consciousness be monitored after the epinephrine injection?",
          "options": [
            "No, it's resolved",
            "Yes, continue monitoring until help arrives"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The effect of epinephrine is temporary; the person must continue to be monitored to detect symptoms returning once the medication's effect wears off."
        },
        {
          "question": "What should you know about the course of events after a treated anaphylactic reaction?",
          "options": [
            "Symptoms can return several hours later (biphasic reaction)",
            "Medical monitoring after the episode is necessary",
            "Once epinephrine is injected, no risk remains",
            "The person can go straight home with no follow-up"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "A second wave of symptoms can occur several hours after the initial reaction, even without new exposure to the allergen, which is why extended medical monitoring is warranted after a treated episode."
        },
        {
          "question": "Should a person with a known allergy always carry their auto-injector?",
          "options": [
            "It's not necessary",
            "Yes, it's strongly recommended"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A person who has already had a severe reaction remains at risk of it happening again at any time; keeping their treatment on hand allows for immediate administration in case of new exposure."
        },
        {
          "question": "Can stress worsen the perception of symptoms?",
          "options": [
            "No, unrelated",
            "The rescuer's calmness helps reassure the victim"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Stress can speed up the heart rate and amplify the victim's sense of respiratory distress; a calm rescuer helps limit this effect."
        },
        {
          "question": "What is the possible time frame for symptoms to appear after exposure to the allergen?",
          "options": [
            "Always instant, in under a second",
            "From a few minutes to about 1-2 hours depending on the case",
            "It can vary depending on the route of exposure (sting, food, medication)",
            "Always after more than 24 hours"
          ],
          "correctAnswers": [
            1,
            2
          ],
          "explanation": "The onset time varies from a few minutes to about two hours depending on the person and the route of exposure (a sting generally acts faster than a digested food), but never after as long as 24 hours."
        }
      ]
    }
  },
  {
    "id": "convulsions",
    "order": 10,
    "icon": "activity",
    "color": "#1565C0",
    "difficulty": "Très difficile",
    "image": "https://images.unsplash.com/photo-1734174040265-ef440f9373dc?fm=jpg&q=80&w=600&auto=format&fit=crop",
    "fr": {
      "title": "Convulsions",
      "description": "Protéger une personne en crise convulsive",
      "steps": [
        {
          "title": "Protégez",
          "substeps": [
            "Éloignez tous les objets dangereux et durs autour de la personne pour éviter les blessures"
          ]
        },
        {
          "title": "Ne pas entraver",
          "substeps": [
            "Ne forcez jamais les mouvements",
            "Ne mettez jamais rien dans la bouche de la victime"
          ]
        },
        {
          "title": "Protégez la tête",
          "substeps": [
            "Si possible, glissez quelque chose de souple sous la tête sans entraver les mouvements"
          ]
        },
        {
          "title": "Chronométrez",
          "substeps": [
            "Notez précisément l'heure de début de la crise"
          ]
        },
        {
          "title": "Après la crise - PLS",
          "substeps": [
            "Dès que les mouvements cessent, mettez la personne en position latérale de sécurité"
          ]
        },
        {
          "title": "Alertez si nécessaire",
          "substeps": [
            "Appelez le 185 si la crise dure plus de 5 minutes, se répète, ou si c'est la première crise"
          ]
        },
        {
          "title": "Restez et rassurez",
          "substeps": [
            "La personne peut être confuse au réveil",
            "Restez calme",
            "Rassurez-la",
            "Ne la laissez pas seule"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Faut-il mettre quelque chose dans la bouche ?",
          "options": [
            "Oui, pour éviter qu'elle se morde",
            "Non, jamais"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Un objet placé dans la bouche pendant les mouvements convulsifs risque de blesser les dents, la mâchoire, ou de provoquer une inhalation s'il se déloge — le risque de morsure de langue est bien moindre que celui-ci."
        },
        {
          "question": "Que faire une fois que les mouvements convulsifs s'arrêtent ?",
          "options": [
            "Mettre la personne en position latérale de sécurité",
            "Noter l'heure de fin de la crise",
            "La faire boire immédiatement pour la réhydrater",
            "Rester auprès d'elle et la rassurer à son réveil"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "La PLS protège les voies respiratoires pendant la phase de récupération, noter l'heure aide à évaluer la durée totale de l'épisode, et rassurer la personne l'aide à traverser la confusion post-critique fréquente ; donner à boire trop tôt expose à une fausse route tant que la déglutition n'est pas totalement récupérée."
        },
        {
          "question": "Faut-il forcer les mouvements pour les arrêter ?",
          "options": [
            "Oui pour la calmer",
            "Non, jamais entraver les mouvements"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Retenir de force les membres pendant une crise peut provoquer des fractures, des luxations ou des lésions musculaires sans stopper la crise elle-même, qui suit son cours indépendamment de toute contention."
        },
        {
          "question": "Dans quels cas une crise convulsive nécessite-t-elle un appel systématique au 185 ?",
          "options": [
            "La crise dure plus de 5 minutes",
            "C'est la toute première crise de la personne",
            "La crise se répète sans reprise de conscience entre les épisodes",
            "La personne récupère normalement en 1 minute"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "Une crise prolongée, une première crise jamais évaluée médicalement, ou des crises répétées sans réveil entre elles (état de mal épileptique) sont trois situations à haut risque nécessitant une prise en charge médicale urgente."
        },
        {
          "question": "Que faut-il chronométrer ?",
          "options": [
            "Le rythme cardiaque",
            "L'heure de début de la crise"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Connaître la durée exacte de la crise permet de savoir si elle dépasse le seuil de 5 minutes qui impose une alerte médicale urgente."
        },
        {
          "question": "La personne peut-elle être confuse après la crise ?",
          "options": [
            "Non elle est immédiatement normale",
            "Oui c'est fréquent, il faut la rassurer"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "La phase de récupération après une crise (état post-critique) s'accompagne souvent d'une confusion transitoire due à l'activité électrique anormale qui vient de traverser le cerveau."
        },
        {
          "question": "Une première crise convulsive nécessite-t-elle un appel au 185 ?",
          "options": [
            "Non si ça s'arrête vite",
            "Oui, toute première crise doit être évaluée médicalement"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une première crise peut révéler une cause sous-jacente à identifier (fièvre, trouble métabolique, lésion cérébrale...) qui nécessite un bilan médical même si la crise s'est arrêtée d'elle-même."
        },
        {
          "question": "Faut-il éloigner les objets dangereux pendant la crise ?",
          "options": [
            "Oui pour éviter les blessures",
            "Non ce n'est pas la priorité"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Les mouvements convulsifs sont incontrôlés et violents ; éloigner ce qui pourrait blesser la personne prévient les traumatismes pendant la crise."
        },
        {
          "question": "Une crise qui se répète sans reprise de conscience entre les épisodes est-elle grave ?",
          "options": [
            "Non c'est normal",
            "Oui, c'est une urgence (état de mal épileptique)"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Une succession de crises sans reprise de conscience entre elles épuise le cerveau et peut causer des lésions neurologiques ; c'est une urgence médicale reconnue sous le nom d'état de mal épileptique."
        },
        {
          "question": "Faut-il retenir fermement les membres de la personne ?",
          "options": [
            "Oui pour limiter les dégâts",
            "Non, ne jamais retenir les mouvements"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Retenir fermement les membres pendant les mouvements convulsifs peut provoquer des fractures ou des entorses sans arrêter la crise, qui suit un mécanisme électrique cérébral indépendant de toute contention physique."
        },
        {
          "question": "Concernant les convulsions fébriles chez le jeune enfant :",
          "options": [
            "La fièvre peut en être la cause chez le jeune enfant",
            "Elles n'existent jamais chez l'enfant",
            "Elles nécessitent les mêmes gestes de protection qu'une crise convulsive classique",
            "Elles surviennent uniquement après 10 ans"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Les convulsions fébriles touchent spécifiquement le jeune enfant lors d'une montée rapide de fièvre, et se gèrent avec les mêmes gestes de protection (dégager l'espace, protéger la tête, PLS après la crise) qu'une crise convulsive classique."
        },
        {
          "question": "Faut-il laisser la personne seule après une crise pour aller chercher de l'aide ?",
          "options": [
            "Oui c'est nécessaire",
            "Non si possible, rester ou faire alerter par quelqu'un d'autre"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Laisser la personne seule pendant la phase de récupération l'expose à un risque si une nouvelle crise survient ou si elle est encore confuse ; il vaut mieux faire alerter par un tiers si possible."
        },
        {
          "question": "Concernant la durée d'une crise convulsive :",
          "options": [
            "Une crise simple dure généralement moins de 2-3 minutes",
            "Une crise qui dépasse 5 minutes doit alerter",
            "Elle dure toujours plus de 30 minutes",
            "La durée n'a aucune importance médicale"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Une crise convulsive simple s'arrête spontanément en quelques minutes ; au-delà de 5 minutes, le risque de complications neurologiques augmente et justifie une alerte immédiate des secours."
        },
        {
          "question": "Doit-on donner à boire à la personne juste après la crise ?",
          "options": [
            "Non, attendre qu'elle soit pleinement consciente",
            "Oui immédiatement pour la réhydrater"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Juste après une crise, les réflexes de déglutition peuvent être encore altérés, ce qui expose à une fausse route si on donne à boire trop tôt."
        },
        {
          "question": "La PLS après une crise sert à quoi ?",
          "options": [
            "À la réveiller plus vite",
            "À protéger ses voies respiratoires pendant la phase de récupération"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Comme après toute perte de connaissance, la PLS évite qu'une éventuelle salive ou des vomissements ne soient inhalés pendant que la personne reprend pleinement conscience."
        },
        {
          "question": "Quelles précautions prendre pour protéger une personne pendant une crise convulsive ?",
          "options": [
            "Éloigner les objets dangereux et durs autour d'elle",
            "Glisser quelque chose de souple sous sa tête",
            "Mettre un objet dans sa bouche pour protéger sa langue",
            "Retenir fermement ses membres pour limiter les mouvements"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Écarter les objets dangereux et protéger la tête avec un support souple préviennent les blessures par choc, sans interférer avec les mouvements convulsifs ; mettre un objet dans la bouche ou retenir les membres, en revanche, risque de blesser la personne ou le secouriste."
        },
        {
          "question": "Faut-il systématiquement aller à l'hôpital après chaque crise connue chez un épileptique traité ?",
          "options": [
            "Oui toujours",
            "Pas systématiquement, sauf signes inhabituels, durée prolongée ou répétition"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Chez un épileptique déjà suivi, une crise habituelle et brève ne nécessite pas toujours un passage aux urgences, sauf si elle diffère des crises habituelles, dure plus longtemps ou se répète."
        },
        {
          "question": "La morsure de langue pendant une crise justifie-t-elle de mettre un objet dans la bouche ?",
          "options": [
            "Non, le risque de l'objet est pire que la morsure",
            "Oui pour protéger la langue"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Le risque de blesser les dents, la mâchoire ou de provoquer une inhalation de l'objet dépasse largement le risque, en réalité limité, d'une morsure de langue pendant la crise."
        },
        {
          "question": "Concernant la recherche d'une cause à une crise convulsive :",
          "options": [
            "Un bilan médical est souvent nécessaire pour en identifier la cause",
            "La cause est toujours évidente immédiatement",
            "La fièvre peut être une cause chez l'enfant",
            "Aucun bilan n'est jamais utile"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "De nombreuses causes possibles (épilepsie, fièvre, traumatisme, trouble métabolique...) ne peuvent être distinguées qu'après un bilan médical ; ce n'est pas systématiquement évident sur le terrain, contrairement à la fièvre chez l'enfant qui est une cause reconnue et fréquente."
        },
        {
          "question": "Le retour à un état de conscience normal après une crise prend ?",
          "options": [
            "Du temps variable, parfois plusieurs minutes de confusion",
            "Toujours moins d'une seconde"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "La confusion post-critique peut durer de quelques minutes à parfois plus longtemps selon la personne et la durée de la crise, ce qui est normal et ne doit pas inquiéter outre mesure si elle s'améliore progressivement."
        }
      ]
    },
    "en": {
      "title": "Seizures",
      "description": "Protect someone having a seizure",
      "steps": [
        {
          "title": "Protect them",
          "substeps": [
            "Move any dangerous or hard objects away from the person to prevent injury"
          ]
        },
        {
          "title": "Don't restrain",
          "substeps": [
            "Never force their movements",
            "Never put anything in the victim's mouth"
          ]
        },
        {
          "title": "Protect the head",
          "substeps": [
            "If possible, slide something soft under the head without restricting movement"
          ]
        },
        {
          "title": "Time it",
          "substeps": [
            "Note the exact time the seizure started"
          ]
        },
        {
          "title": "After the seizure — recovery position",
          "substeps": [
            "As soon as the movements stop, place the person in the recovery position"
          ]
        },
        {
          "title": "Call for help if necessary",
          "substeps": [
            "Call 185 if the seizure lasts more than 5 minutes, repeats, or if it's their first seizure"
          ]
        },
        {
          "title": "Stay and reassure",
          "substeps": [
            "The person may be confused when they come to",
            "Stay calm",
            "Reassure them",
            "Don't leave them alone"
          ]
        }
      ],
      "quiz": [
        {
          "question": "Should you put something in their mouth?",
          "options": [
            "Yes, to stop them from biting their tongue",
            "No, never"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "An object placed in the mouth during convulsive movements risks injuring the teeth or jaw, or causing choking if it comes loose — the risk of tongue biting is far smaller than this."
        },
        {
          "question": "What should you do once the convulsive movements stop?",
          "options": [
            "Place the person in the recovery position",
            "Note the time the seizure ended",
            "Give them water immediately to rehydrate them",
            "Stay with them and reassure them as they come to"
          ],
          "correctAnswers": [
            0,
            1,
            3
          ],
          "explanation": "The recovery position protects the airway during the recovery phase, noting the time helps assess the total duration of the episode, and reassuring the person helps them through the common post-seizure confusion; giving them water too soon risks choking as long as their ability to swallow hasn't fully returned."
        },
        {
          "question": "Should you force their movements to stop them?",
          "options": [
            "Yes, to calm them down",
            "No, never restrain the movements"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Forcibly holding down the limbs during a seizure can cause fractures, dislocations, or muscle injuries without stopping the seizure itself, which runs its course independently of any restraint."
        },
        {
          "question": "In which cases does a seizure always require calling 185?",
          "options": [
            "The seizure lasts more than 5 minutes",
            "It's the person's very first seizure",
            "The seizure repeats without regaining consciousness between episodes",
            "The person recovers normally within 1 minute"
          ],
          "correctAnswers": [
            0,
            1,
            2
          ],
          "explanation": "A prolonged seizure, a first seizure never medically evaluated, or repeated seizures without regaining consciousness between them (status epilepticus) are three high-risk situations requiring urgent medical care."
        },
        {
          "question": "What should you time?",
          "options": [
            "The heart rate",
            "The time the seizure started"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Knowing the exact duration of the seizure tells you whether it exceeds the 5-minute threshold that requires an urgent medical call."
        },
        {
          "question": "Can the person be confused after the seizure?",
          "options": [
            "No, they're back to normal immediately",
            "Yes, it's common — you should reassure them"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "The recovery phase after a seizure (the postictal state) is often accompanied by temporary confusion caused by the abnormal electrical activity that just passed through the brain."
        },
        {
          "question": "Does a first-time seizure require calling 185?",
          "options": [
            "No, if it stops quickly",
            "Yes, every first seizure must be medically evaluated"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A first seizure can reveal an underlying cause that needs to be identified (fever, a metabolic disorder, a brain injury...), which requires a medical workup even if the seizure stopped on its own."
        },
        {
          "question": "Should dangerous objects be moved away during the seizure?",
          "options": [
            "Yes, to prevent injury",
            "No, that's not the priority"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Convulsive movements are uncontrolled and forceful; moving away anything that could injure the person prevents trauma during the seizure."
        },
        {
          "question": "Is a seizure that repeats without regaining consciousness between episodes serious?",
          "options": [
            "No, that's normal",
            "Yes, it's an emergency (status epilepticus)"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "A series of seizures without regaining consciousness between them exhausts the brain and can cause neurological damage; it is a recognized medical emergency called status epilepticus."
        },
        {
          "question": "Should the person's limbs be firmly held down?",
          "options": [
            "Yes, to limit the damage",
            "No, never restrain the movements"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Firmly holding down the limbs during convulsive movements can cause fractures or sprains without stopping the seizure, which follows a brain electrical mechanism independent of any physical restraint."
        },
        {
          "question": "Regarding febrile seizures in young children:",
          "options": [
            "Fever can be the cause in young children",
            "They never occur in children",
            "They require the same protective steps as a typical seizure",
            "They only occur after age 10"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Febrile seizures specifically affect young children during a rapid rise in fever, and are managed with the same protective steps (clearing the space, protecting the head, recovery position afterward) as a typical seizure."
        },
        {
          "question": "Should you leave the person alone after a seizure to go get help?",
          "options": [
            "Yes, it's necessary",
            "No, if possible — stay, or have someone else call for help"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "Leaving the person alone during the recovery phase puts them at risk if another seizure occurs or if they are still confused; it is better to have someone else call for help if possible."
        },
        {
          "question": "Regarding the duration of a seizure:",
          "options": [
            "A simple seizure usually lasts less than 2-3 minutes",
            "A seizure lasting more than 5 minutes should raise concern",
            "It always lasts more than 30 minutes",
            "Duration has no medical significance"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "A simple seizure stops on its own within a few minutes; beyond 5 minutes, the risk of neurological complications increases and warrants immediately calling for help."
        },
        {
          "question": "Should the person be given water right after the seizure?",
          "options": [
            "No, wait until they're fully conscious",
            "Yes, immediately, to rehydrate them"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Right after a seizure, the swallowing reflex may still be impaired, which risks choking if water is given too soon."
        },
        {
          "question": "What is the recovery position for after a seizure?",
          "options": [
            "To wake them up faster",
            "To protect their airway during the recovery phase"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "As with any loss of consciousness, the recovery position prevents saliva or vomit from being inhaled while the person regains full consciousness."
        },
        {
          "question": "What precautions should be taken to protect someone during a seizure?",
          "options": [
            "Move dangerous or hard objects away from them",
            "Slide something soft under their head",
            "Put an object in their mouth to protect their tongue",
            "Firmly hold their limbs to limit movement"
          ],
          "correctAnswers": [
            0,
            1
          ],
          "explanation": "Moving dangerous objects away and cushioning the head with something soft prevent impact injuries without interfering with the convulsive movements; putting an object in the mouth or holding down the limbs, on the other hand, risks injuring the person or the rescuer."
        },
        {
          "question": "Should you always go to the hospital after every known seizure in a treated epileptic?",
          "options": [
            "Yes, always",
            "Not always — unless there are unusual signs, a prolonged duration, or repetition"
          ],
          "correctAnswers": [
            1
          ],
          "explanation": "For an epileptic already under medical care, a typical, brief seizure doesn't always require an ER visit, unless it differs from their usual seizures, lasts longer, or repeats."
        },
        {
          "question": "Does tongue biting during a seizure justify putting an object in the mouth?",
          "options": [
            "No, the risk from the object is worse than the bite",
            "Yes, to protect the tongue"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "The risk of injuring the teeth or jaw, or of the object being inhaled, far outweighs the actually limited risk of a tongue bite during the seizure."
        },
        {
          "question": "Regarding finding the cause of a seizure:",
          "options": [
            "A medical workup is often needed to identify the cause",
            "The cause is always immediately obvious",
            "Fever can be a cause in children",
            "No workup is ever useful"
          ],
          "correctAnswers": [
            0,
            2
          ],
          "explanation": "Many possible causes (epilepsy, fever, trauma, a metabolic disorder...) can only be distinguished after a medical workup; it is not always obvious on the scene, unlike fever in children, which is a recognized and common cause."
        },
        {
          "question": "Returning to a normal state of consciousness after a seizure takes?",
          "options": [
            "A variable amount of time, sometimes several minutes of confusion",
            "Always less than a second"
          ],
          "correctAnswers": [
            0
          ],
          "explanation": "Postictal confusion can last from a few minutes to sometimes longer depending on the person and the length of the seizure, which is normal and should not cause excessive worry if it gradually improves."
        }
      ]
    }
  }
];
