document.addEventListener('DOMContentLoaded', () => {
    const initThreeJSAnimation = (containerId) => {
        const container = document.getElementById(containerId);
        if (!container) {
            console.warn(`Three.js container not found: ${containerId}`);
            return;
        }

        let scene, camera, renderer, particles, particleMaterial;
        let mouseX = 0, mouseY = 0;

        const init = () => {
            scene = new THREE.Scene();
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
            camera.position.z = 1000;

            renderer = new THREE.WebGLRenderer({ alpha: true });
            renderer.setSize(container.offsetWidth, container.offsetHeight);
            container.appendChild(renderer.domElement);

            const geometry = new THREE.BufferGeometry();
            const vertices = [];

            for (let i = 0; i < 1000; i++) {
                vertices.push(
                    Math.random() * 2000 - 1000,
                    Math.random() * 2000 - 1000,
                    Math.random() * 2000 - 1000
                );
            }
            geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));

            particleMaterial = new THREE.PointsMaterial({
                color: 0xffffff,
                size: 2,
                transparent: true,
                opacity: 0.8
            });

            particles = new THREE.Points(geometry, particleMaterial);
            scene.add(particles);

            document.addEventListener('mousemove', onDocumentMouseMove, false);
            window.addEventListener('resize', onWindowResize, false);
        };

        const onDocumentMouseMove = (event) => {
            mouseX = (event.clientX - window.innerWidth / 2);
            mouseY = (event.clientY - window.innerHeight / 2);
        };

        const onWindowResize = () => {
            if (container) {
                camera.aspect = container.offsetWidth / container.offsetHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(container.offsetWidth, container.offsetHeight);
            }
        };

        const animate = () => {
            requestAnimationFrame(animate);

            if (particles) {
                particles.rotation.x += 0.0005;
                particles.rotation.y += 0.001;

                camera.position.x += (mouseX * 0.05 - camera.position.x) * 0.05;
                camera.position.y += (-mouseY * 0.05 - camera.position.y) * 0.05;
                camera.lookAt(scene.position);
            }

            if (renderer) {
                renderer.render(scene, camera);
            }
        };

        init();
        animate();
    };

    // Initialize for Login Page
    initThreeJSAnimation('canvas3d-container');

    // Initialize for Signup Page (if different container ID)
    initThreeJSAnimation('canvas3d-container-signup');
});