let scene, camera, renderer, globe, cityMap;
let routes = [];
let dangerZones = [];
let incidentPins = [];
let vehicles = [];
let currentView = 'globe';
let isDay = true;
let isDemoMode = false;
let demoPathIndex = 0;
let animationProgress = 0;
let routeProgress = 0;

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

class PathSafeApp {
    constructor() {
        this.container = document.getElementById('threejs-canvas');
        this.clock = new THREE.Clock();
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.hoveredObject = null;
        
        this.init();
        this.setupEventListeners();
        this.loadAssets();
    }

    init() {
        try {
            scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x000510, 0.002);

            camera = new THREE.PerspectiveCamera(
                60,
                window.innerWidth / window.innerHeight,
                0.1,
                1000
            );
            camera.position.set(0, 5, 15);
            camera.lookAt(0, 0, 0);

            const canvas = this.container;
            const contextAttributes = {
                alpha: true,
                antialias: !isMobile,
                powerPreference: 'high-performance',
                failIfMajorPerformanceCaveat: false
            };

            const gl = canvas.getContext('webgl2', contextAttributes) || 
                      canvas.getContext('webgl', contextAttributes) ||
                      canvas.getContext('experimental-webgl', contextAttributes);

            if (!gl) {
                this.showFallback();
                return;
            }

            renderer = new THREE.WebGLRenderer({
                canvas: canvas,
                context: gl,
                antialias: !isMobile,
                alpha: true,
                powerPreference: 'high-performance'
            });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
            renderer.shadowMap.enabled = !isMobile;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            renderer.toneMapping = THREE.ACESFilmicToneMapping;
            renderer.toneMappingExposure = 1.2;

            this.setupPostProcessing();
            this.setupLighting();
            this.createStars();
        } catch (error) {
            console.error('WebGL initialization failed:', error);
            this.showFallback();
        }
    }

    showFallback() {
        document.getElementById('preloader').style.display = 'none';
        document.getElementById('demo-tour').classList.remove('hidden');
        document.getElementById('demo-tour').classList.add('flex');
        
        const fallbackMessage = document.createElement('div');
        fallbackMessage.className = 'fixed inset-0 z-10 flex items-center justify-center bg-gray-950';
        fallbackMessage.innerHTML = `
            <div class="text-center max-w-2xl mx-4 p-8 glass-card-dark">
                <h2 class="text-3xl font-bold gradient-text mb-4">PathSafe Demo</h2>
                <p class="text-gray-300 mb-6">
                    This demo requires WebGL support. Your browser or environment doesn't support WebGL,
                    but PathSafe works great on modern browsers with hardware acceleration.
                </p>
                <p class="text-sm text-gray-400">
                    Try viewing this on Chrome, Firefox, or Safari with GPU acceleration enabled.
                </p>
            </div>
        `;
        document.body.insertBefore(fallbackMessage, document.body.firstChild);
    }

    setupPostProcessing() {
        if (!isMobile && typeof THREE.EffectComposer !== 'undefined') {
            this.composer = new THREE.EffectComposer(renderer);
            
            const renderPass = new THREE.RenderPass(scene, camera);
            this.composer.addPass(renderPass);

            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                1.5,
                0.4,
                0.85
            );
            bloomPass.threshold = 0.21;
            bloomPass.strength = 1.2;
            bloomPass.radius = 0.55;
            this.composer.addPass(bloomPass);
            this.bloomPass = bloomPass;

            this.postProcessingEnabled = true;
        } else {
            this.postProcessingEnabled = false;
        }
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0x404040, 1);
        scene.add(ambientLight);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
        sunLight.position.set(10, 10, 5);
        sunLight.castShadow = !isMobile;
        sunLight.shadow.mapSize.width = 2048;
        sunLight.shadow.mapSize.height = 2048;
        scene.add(sunLight);
        this.sunLight = sunLight;

        const moonLight = new THREE.DirectionalLight(0x4488ff, 0);
        moonLight.position.set(-10, 10, -5);
        scene.add(moonLight);
        this.moonLight = moonLight;

        const bluePoint = new THREE.PointLight(0x00a8ff, 2, 20);
        bluePoint.position.set(5, 5, 5);
        scene.add(bluePoint);

        const purplePoint = new THREE.PointLight(0x9c88ff, 2, 20);
        purplePoint.position.set(-5, 5, -5);
        scene.add(purplePoint);
    }

    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const starsMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.1,
            transparent: true,
            opacity: 0.8
        });

        const starsVertices = [];
        for (let i = 0; i < 1000; i++) {
            const x = (Math.random() - 0.5) * 200;
            const y = (Math.random() - 0.5) * 200;
            const z = (Math.random() - 0.5) * 200;
            starsVertices.push(x, y, z);
        }

        starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
        const stars = new THREE.Points(starsGeometry, starsMaterial);
        scene.add(stars);
    }

    async loadAssets() {
        let progress = 0;
        const updateProgress = (percent, message) => {
            progress = percent;
            document.getElementById('progress-bar').style.width = `${percent}%`;
            document.getElementById('progress-text').textContent = `${message}... ${Math.round(percent)}%`;
        };

        updateProgress(20, 'Creating 3D Globe');
        await this.createGlobe();
        
        updateProgress(40, 'Building City Map');
        await this.createCityMap();
        
        updateProgress(60, 'Loading Routes');
        await this.createRoutes();
        
        updateProgress(80, 'Initializing Danger Zones');
        await this.createDangerZones();
        
        updateProgress(90, 'Adding Incidents');
        await this.createIncidentPins();
        
        updateProgress(95, 'Spawning Vehicles');
        await this.createVehicles();
        
        updateProgress(100, 'Ready');
        
        setTimeout(() => {
            document.getElementById('preloader').style.display = 'none';
            document.getElementById('demo-tour').classList.remove('hidden');
            document.getElementById('demo-tour').classList.add('flex');
        }, 500);

        this.animate();
    }

    async createGlobe() {
        return new Promise(resolve => {
            const globeGroup = new THREE.Group();
            
            const globeGeometry = new THREE.SphereGeometry(5, 64, 64);
            const globeMaterial = new THREE.MeshStandardMaterial({
                color: 0x002244,
                emissive: 0x003366,
                emissiveIntensity: 0.3,
                roughness: 0.7,
                metalness: 0.3,
                transparent: true,
                opacity: 0.95
            });
            const globeMesh = new THREE.Mesh(globeGeometry, globeMaterial);
            globeGroup.add(globeMesh);

            const wireframeGeometry = new THREE.SphereGeometry(5.1, 32, 32);
            const wireframeMaterial = new THREE.MeshBasicMaterial({
                color: 0x00a8ff,
                wireframe: true,
                transparent: true,
                opacity: 0.3
            });
            const wireframe = new THREE.Mesh(wireframeGeometry, wireframeMaterial);
            globeGroup.add(wireframe);

            const outerGlowGeometry = new THREE.SphereGeometry(5.3, 32, 32);
            const outerGlowMaterial = new THREE.MeshBasicMaterial({
                color: 0x0088ff,
                transparent: true,
                opacity: 0.1,
                side: THREE.BackSide
            });
            const outerGlow = new THREE.Mesh(outerGlowGeometry, outerGlowMaterial);
            globeGroup.add(outerGlow);

            for (let i = 0; i < 50; i++) {
                const phi = Math.acos(-1 + (2 * i) / 50);
                const theta = Math.sqrt(50 * Math.PI) * phi;

                const x = 5.1 * Math.cos(theta) * Math.sin(phi);
                const y = 5.1 * Math.sin(theta) * Math.sin(phi);
                const z = 5.1 * Math.cos(phi);

                const pointGeometry = new THREE.SphereGeometry(0.05, 8, 8);
                const pointMaterial = new THREE.MeshBasicMaterial({
                    color: Math.random() > 0.7 ? 0x44ff88 : 0x00a8ff
                });
                const point = new THREE.Mesh(pointGeometry, pointMaterial);
                point.position.set(x, y, z);
                globeGroup.add(point);
            }

            globeGroup.visible = true;
            scene.add(globeGroup);
            globe = globeGroup;
            
            resolve();
        });
    }

    async createCityMap() {
        return new Promise(resolve => {
            const cityGroup = new THREE.Group();

            const groundGeometry = new THREE.PlaneGeometry(50, 50);
            const groundMaterial = new THREE.MeshStandardMaterial({
                color: 0x0a0a0a,
                roughness: 0.8,
                metalness: 0.2
            });
            const ground = new THREE.Mesh(groundGeometry, groundMaterial);
            ground.rotation.x = -Math.PI / 2;
            ground.receiveShadow = true;
            cityGroup.add(ground);

            const gridHelper = new THREE.GridHelper(50, 50, 0x00a8ff, 0x003366);
            gridHelper.material.transparent = true;
            gridHelper.material.opacity = 0.3;
            cityGroup.add(gridHelper);

            for (let i = 0; i < 30; i++) {
                const width = Math.random() * 2 + 0.5;
                const height = Math.random() * 8 + 2;
                const depth = Math.random() * 2 + 0.5;

                const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
                const buildingMaterial = new THREE.MeshStandardMaterial({
                    color: 0x1a1a2e,
                    emissive: 0x0f3460,
                    emissiveIntensity: 0.1,
                    roughness: 0.7,
                    metalness: 0.3
                });
                const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
                
                building.position.x = (Math.random() - 0.5) * 40;
                building.position.y = height / 2;
                building.position.z = (Math.random() - 0.5) * 40;
                building.castShadow = !isMobile;
                building.receiveShadow = !isMobile;

                cityGroup.add(building);

                for (let j = 0; j < 5; j++) {
                    if (Math.random() > 0.5) {
                        const windowGeometry = new THREE.BoxGeometry(0.2, 0.3, 0.1);
                        const windowMaterial = new THREE.MeshStandardMaterial({
                            color: 0xffdd00,
                            emissive: 0xffdd00,
                            emissiveIntensity: 0.8,
                            roughness: 0.3,
                            metalness: 0.1
                        });
                        const window = new THREE.Mesh(windowGeometry, windowMaterial);
                        window.position.set(
                            building.position.x + (Math.random() - 0.5) * width,
                            building.position.y + (Math.random() - 0.5) * height,
                            building.position.z + width / 2 + 0.05
                        );
                        cityGroup.add(window);
                    }
                }
            }

            cityGroup.visible = false;
            scene.add(cityGroup);
            cityMap = cityGroup;
            
            resolve();
        });
    }

    async createRoutes() {
        return new Promise(async resolve => {
            const routeData = [
                { points: [[0, 0, 0], [3, 0.5, 2], [5, 0, 4]], color: 0x44ff88, safety: 0.9 },
                { points: [[2, 0, -2], [-1, 0.3, -4], [-3, 0, -5]], color: 0x00a8ff, safety: 0.85 },
                { points: [[-3, 0, 2], [0, 0.4, 3], [4, 0, 2]], color: 0x9c88ff, safety: 0.95 }
            ];

            for (const data of routeData) {
                const curve = new THREE.CatmullRomCurve3(
                    data.points.map(p => new THREE.Vector3(...p))
                );

                const tubeGeometry = new THREE.TubeGeometry(curve, 100, 0.1, 8, false);
                const tubeMaterial = new THREE.MeshStandardMaterial({
                    color: data.color,
                    transparent: true,
                    opacity: 0.8,
                    emissive: data.color,
                    emissiveIntensity: 0.8,
                    roughness: 0.3,
                    metalness: 0.2
                });

                const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
                tube.userData = { curve, color: data.color, safety: data.safety, progress: 0 };
                
                if (currentView === 'globe') {
                    tube.visible = true;
                } else {
                    tube.visible = false;
                }
                
                scene.add(tube);
                routes.push(tube);
            }

            resolve();
        });
    }

    async createDangerZones() {
        return new Promise(resolve => {
            const dangerData = [
                { position: [4, 0.1, -3], severity: 0.8, radius: 1.5 },
                { position: [-4, 0.1, 3], severity: 0.5, radius: 1.0 },
                { position: [2, 0.1, 5], severity: 0.3, radius: 0.8 }
            ];

            dangerData.forEach(data => {
                const geometry = new THREE.CircleGeometry(data.radius, 32);
                const material = new THREE.MeshBasicMaterial({
                    color: data.severity > 0.7 ? 0xff4757 : (data.severity > 0.4 ? 0xffa502 : 0xffdd00),
                    transparent: true,
                    opacity: 0.4,
                    side: THREE.DoubleSide
                });
                
                const zone = new THREE.Mesh(geometry, material);
                zone.position.set(...data.position);
                zone.rotation.x = -Math.PI / 2;
                zone.userData = { severity: data.severity, radius: data.radius, baseOpacity: 0.4 };
                
                zone.visible = currentView === 'city';
                scene.add(zone);
                dangerZones.push(zone);
            });

            resolve();
        });
    }

    async createIncidentPins() {
        return new Promise(resolve => {
            const incidents = [
                { position: [3, 0, 3], type: 'crime', severity: 'high', description: 'Robbery reported' },
                { position: [-3, 0, -3], type: 'accident', severity: 'medium', description: 'Traffic incident' },
                { position: [0, 0, -4], type: 'hazard', severity: 'low', description: 'Road construction' }
            ];

            incidents.forEach(incident => {
                const pinGroup = new THREE.Group();

                const coneGeometry = new THREE.ConeGeometry(0.15, 0.5, 8);
                const coneMaterial = new THREE.MeshStandardMaterial({
                    color: incident.severity === 'high' ? 0xff4757 : 
                           incident.severity === 'medium' ? 0xffa502 : 0xffdd00,
                    emissive: incident.severity === 'high' ? 0xff4757 : 
                              incident.severity === 'medium' ? 0xffa502 : 0xffdd00,
                    emissiveIntensity: 0.5
                });
                const cone = new THREE.Mesh(coneGeometry, coneMaterial);
                cone.position.y = 0.25;
                pinGroup.add(cone);

                const sphereGeometry = new THREE.SphereGeometry(0.2, 16, 16);
                const sphereMaterial = new THREE.MeshStandardMaterial({
                    color: 0xffffff,
                    emissive: 0xffffff,
                    emissiveIntensity: 0.3,
                    transparent: true,
                    opacity: 0.9
                });
                const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
                sphere.position.y = 0.6;
                pinGroup.add(sphere);

                pinGroup.position.set(...incident.position);
                pinGroup.userData = incident;
                pinGroup.visible = currentView === 'city';
                
                scene.add(pinGroup);
                incidentPins.push(pinGroup);
            });

            resolve();
        });
    }

    async createVehicles() {
        return new Promise(resolve => {
            for (let i = 0; i < 5; i++) {
                const vehicleGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.5);
                const vehicleMaterial = new THREE.MeshStandardMaterial({
                    color: 0x00a8ff,
                    emissive: 0x00a8ff,
                    emissiveIntensity: 0.3
                });
                const vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
                
                vehicle.position.set(
                    (Math.random() - 0.5) * 10,
                    0.1,
                    (Math.random() - 0.5) * 10
                );
                
                vehicle.userData = {
                    speed: Math.random() * 0.02 + 0.01,
                    direction: new THREE.Vector3(
                        Math.random() - 0.5,
                        0,
                        Math.random() - 0.5
                    ).normalize()
                };
                
                vehicle.visible = currentView === 'city';
                scene.add(vehicle);
                vehicles.push(vehicle);
            }

            resolve();
        });
    }

    toggleView() {
        if (currentView === 'globe') {
            currentView = 'city';
            this.transitionToCity();
        } else {
            currentView = 'globe';
            this.transitionToGlobe();
        }
    }

    transitionToGlobe() {
        globe.visible = true;
        cityMap.visible = false;
        
        routes.forEach(route => route.visible = true);
        dangerZones.forEach(zone => zone.visible = false);
        incidentPins.forEach(pin => pin.visible = false);
        vehicles.forEach(vehicle => vehicle.visible = false);

        this.animateCamera(new THREE.Vector3(0, 5, 15), new THREE.Vector3(0, 0, 0), 1500);
        
        document.getElementById('view-label').textContent = 'City View';
    }

    transitionToCity() {
        globe.visible = false;
        cityMap.visible = true;
        
        routes.forEach(route => route.visible = false);
        dangerZones.forEach(zone => zone.visible = true);
        incidentPins.forEach(pin => pin.visible = true);
        vehicles.forEach(vehicle => vehicle.visible = true);

        this.animateCamera(new THREE.Vector3(0, 15, 20), new THREE.Vector3(0, 0, 0), 1500);
        
        document.getElementById('view-label').textContent = 'Globe View';
    }

    animateCamera(targetPosition, targetLookAt, duration) {
        const startPosition = camera.position.clone();
        const startLookAt = new THREE.Vector3(0, 0, 0);
        camera.getWorldDirection(startLookAt);
        startLookAt.multiplyScalar(10).add(camera.position);

        const startTime = Date.now();

        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);

            camera.position.lerpVectors(startPosition, targetPosition, eased);
            const currentLookAt = new THREE.Vector3().lerpVectors(startLookAt, targetLookAt, eased);
            camera.lookAt(currentLookAt);

            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };

        animate();
    }

    easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    toggleDayNight() {
        isDay = !isDay;
        
        if (isDay) {
            this.sunLight.intensity = 1.5;
            this.moonLight.intensity = 0;
            scene.fog.color.setHex(0x000510);
            scene.background = null;
            document.getElementById('time-label').textContent = '☀️ Day';
        } else {
            this.sunLight.intensity = 0.3;
            this.moonLight.intensity = 1.0;
            scene.fog.color.setHex(0x000020);
            scene.background = new THREE.Color(0x000020);
            document.getElementById('time-label').textContent = '🌙 Night';
        }

        dangerZones.forEach(zone => {
            if (!isDay) {
                zone.material.opacity = zone.userData.baseOpacity * 1.5;
            } else {
                zone.material.opacity = zone.userData.baseOpacity;
            }
        });
    }

    startDemoMode() {
        isDemoMode = true;
        demoPathIndex = 0;
        
        const demoPaths = [
            { view: 'globe', duration: 3000 },
            { view: 'city', duration: 3000 },
            { view: 'globe', duration: 2000 }
        ];

        const runDemo = () => {
            if (!isDemoMode || demoPathIndex >= demoPaths.length) {
                isDemoMode = false;
                return;
            }

            const path = demoPaths[demoPathIndex];
            
            if (path.view === 'globe' && currentView !== 'globe') {
                this.transitionToGlobe();
            } else if (path.view === 'city' && currentView !== 'city') {
                this.transitionToCity();
            }

            demoPathIndex++;
            setTimeout(runDemo, path.duration);
        };

        runDemo();
    }

    setupEventListeners() {
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            
            if (this.composer) {
                this.composer.setSize(window.innerWidth, window.innerHeight);
            }
        });

        this.container.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        this.container.addEventListener('click', (event) => {
            this.raycaster.setFromCamera(this.mouse, camera);
            const intersects = this.raycaster.intersectObjects(incidentPins, true);

            if (intersects.length > 0) {
                const pin = intersects[0].object.parent;
                if (pin.userData.type) {
                    this.showInfoCard(pin.userData);
                }
            }
        });

        document.getElementById('toggle-view').addEventListener('click', () => {
            this.toggleView();
        });

        document.getElementById('toggle-time').addEventListener('click', () => {
            this.toggleDayNight();
        });

        document.getElementById('start-demo').addEventListener('click', () => {
            document.getElementById('demo-tour').classList.add('hidden');
            document.getElementById('demo-tour').classList.remove('flex');
        });

        document.getElementById('skip-tour').addEventListener('click', () => {
            document.getElementById('demo-tour').classList.add('hidden');
            document.getElementById('demo-tour').classList.remove('flex');
        });

        document.getElementById('watch-demo').addEventListener('click', () => {
            this.startDemoMode();
        });

        document.getElementById('cta-demo')?.addEventListener('click', () => {
            this.startDemoMode();
        });

        document.getElementById('cta-learn')?.addEventListener('click', () => {
            document.getElementById('how-it-works').scrollIntoView({ behavior: 'smooth' });
        });

        document.getElementById('close-card').addEventListener('click', () => {
            document.getElementById('info-card').classList.add('hidden');
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === '1') {
                if (currentView !== 'globe') this.transitionToGlobe();
            } else if (event.key === '2') {
                if (currentView !== 'city') this.transitionToCity();
            } else if (event.key === '3') {
                this.startDemoMode();
            }
        });

        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };

        this.container.addEventListener('mousedown', (event) => {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        });

        this.container.addEventListener('mousemove', (event) => {
            if (isDragging) {
                const deltaX = event.clientX - previousMousePosition.x;
                const deltaY = event.clientY - previousMousePosition.y;

                if (currentView === 'globe' && globe) {
                    globe.rotation.y += deltaX * 0.005;
                    globe.rotation.x += deltaY * 0.005;
                }

                previousMousePosition = { x: event.clientX, y: event.clientY };
            }
        });

        this.container.addEventListener('mouseup', () => {
            isDragging = false;
        });

        this.container.addEventListener('wheel', (event) => {
            event.preventDefault();
            const delta = event.deltaY * 0.01;
            camera.position.z += delta;
            camera.position.z = Math.max(5, Math.min(camera.position.z, 30));
        }, { passive: false });
    }

    showInfoCard(data) {
        const card = document.getElementById('info-card');
        const content = document.getElementById('card-content');
        
        const severityColors = {
            high: 'text-danger-red',
            medium: 'text-warning-orange',
            low: 'text-safe-green'
        };

        content.innerHTML = `
            <h3 class="text-xl font-bold mb-2">${data.type.charAt(0).toUpperCase() + data.type.slice(1)} Alert</h3>
            <p class="text-gray-400 mb-4">${data.description}</p>
            <div class="flex items-center gap-2">
                <span class="text-sm text-gray-400">Severity:</span>
                <span class="font-semibold ${severityColors[data.severity]}">${data.severity.toUpperCase()}</span>
            </div>
        `;
        
        card.classList.remove('hidden');
    }

    updateStats() {
        document.getElementById('stat-routes').textContent = routes.length;
        document.getElementById('stat-dangers').textContent = dangerZones.length;
        
        const avgSafety = routes.reduce((sum, route) => sum + (route.userData.safety || 0), 0) / routes.length;
        document.getElementById('stat-safety').textContent = Math.round(avgSafety * 100);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();

        if (globe && globe.visible) {
            globe.rotation.y += 0.001;
        }

        routes.forEach((route, index) => {
            if (route.visible && route.material) {
                route.userData.progress += 0.002;
                if (route.userData.progress > 1) route.userData.progress = 0;
                
                const pulseIntensity = Math.sin(elapsed * 2 + index) * 0.3 + 0.7;
                route.material.emissiveIntensity = pulseIntensity;
            }
        });

        dangerZones.forEach((zone, index) => {
            if (zone.visible && zone.material) {
                const pulse = Math.sin(elapsed * 3 + index * 2) * 0.3 + 0.7;
                zone.material.opacity = zone.userData.baseOpacity * pulse;
            }
        });

        incidentPins.forEach((pin, index) => {
            if (pin.visible) {
                pin.position.y = Math.sin(elapsed * 2 + index) * 0.2;
                pin.rotation.y += 0.02;
            }
        });

        vehicles.forEach(vehicle => {
            if (vehicle.visible && vehicle.userData.direction) {
                vehicle.position.add(vehicle.userData.direction.clone().multiplyScalar(vehicle.userData.speed));
                
                if (Math.abs(vehicle.position.x) > 20 || Math.abs(vehicle.position.z) > 20) {
                    vehicle.position.set(
                        (Math.random() - 0.5) * 10,
                        0.1,
                        (Math.random() - 0.5) * 10
                    );
                }
            }
        });

        this.updateStats();

        if (this.postProcessingEnabled && this.composer) {
            this.composer.render();
        } else {
            renderer.render(scene, camera);
        }
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new PathSafeApp();
});
