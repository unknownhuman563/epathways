import { useEffect, useRef, useState } from "react";
import { Play, Pause, X } from "lucide-react";
import videoprocess from "@assets/epath-process.mp4";

export default function ProcessFlow() {
    const videoRef = useRef(null);
    const miniVideoRef = useRef(null);

    const [isVisible, setIsVisible] = useState(false);
    const [wasViewed, setWasViewed] = useState(false); // ✅ Track if video was ever viewed
    const [isMiniPlayer, setIsMiniPlayer] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [hideMini, setHideMini] = useState(false);

    // Track video progress
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    // Auto-hide controls
    const [showControls, setShowControls] = useState(true);
    const hideTimerRef = useRef(null);

    const resetControlsTimer = () => {
        setShowControls(true);
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        hideTimerRef.current = setTimeout(() => setShowControls(false), 2000);
    };

    useEffect(() => {
        resetControlsTimer();
        return () => {
            if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
        };
    }, []);

    // Observe visibility
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    setIsMiniPlayer(false);
                    setWasViewed(true); // ✅ Mark video as "viewed"
                } else {
                    setIsVisible(false);
                    if (wasViewed) setIsMiniPlayer(true); // ✅ Only show mini-player if viewed
                }
            },
            { threshold: 0.6 }
        );

        if (videoRef.current) observer.observe(videoRef.current);
        return () => {
            if (videoRef.current) observer.unobserve(videoRef.current);
        };
    }, [wasViewed]);

    useEffect(() => {
        if (!videoRef.current) return;
        if (isVisible && !isPaused) {
            videoRef.current.play().catch(() => { });
        } else {
            videoRef.current.pause();
        }
    }, [isVisible, isPaused]);

    // Track video time & duration
    useEffect(() => {
        const mainVideo = videoRef.current;
        if (!mainVideo) return;

        const updateTime = () => setCurrentTime(mainVideo.currentTime);
        const setVideoDuration = () => setDuration(mainVideo.duration);

        mainVideo.addEventListener("timeupdate", updateTime);
        mainVideo.addEventListener("loadedmetadata", setVideoDuration);

        return () => {
            mainVideo.removeEventListener("timeupdate", updateTime);
            mainVideo.removeEventListener("loadedmetadata", setVideoDuration);
        };
    }, []);

    // Sync mini-player to current time
    useEffect(() => {
        if (isMiniPlayer && miniVideoRef.current) {
            miniVideoRef.current.currentTime = currentTime;
            if (!isPaused) miniVideoRef.current.play().catch(() => { });
        }
    }, [isMiniPlayer]);

    // Play/Pause toggle for main video
    const togglePlayPause = () => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPaused(false);
        } else {
            videoRef.current.pause();
            setIsPaused(true);
        }
    };

    // Play/Pause for mini-player
    const toggleMiniPlayPause = () => {
        if (!miniVideoRef.current) return;
        if (miniVideoRef.current.paused) {
            miniVideoRef.current.play();
            setIsPaused(false);
        } else {
            miniVideoRef.current.pause();
            setIsPaused(true);
        }
    };

    // Seek bar handler
    const handleSeek = (e) => {
        const value = parseFloat(e.target.value);
        if (videoRef.current) {
            videoRef.current.currentTime = value;
            setCurrentTime(value);
        }
        resetControlsTimer();
    };

    return (
        <div className="relative w-full max-w-5xl mx-auto px-4 py-10">
            <h2 className="text-center text-2xl sm:text-3xl md:text-4xl font-bold mb-3 text-gray-900">
                The <span className="text-green-900">e</span>Pathways Journey Experience
            </h2>

            {/* Main video with controls */}
            <div
                className="relative bg-black rounded-2xl overflow-hidden shadow-lg"
                onMouseMove={resetControlsTimer}
                onTouchStart={resetControlsTimer}
            >
                <video
                    ref={videoRef}
                    src={videoprocess}
                    className="w-full"
                    muted
                    defaultMuted
                    playsInline
                    loop
                />

                {/* Controls (auto-hide) */}
                <div
                    className={`absolute bottom-0 left-0 right-0 flex items-center justify-between px-3 py-2 bg-black/50 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"
                        }`}
                >
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        step="0.1"
                        onChange={handleSeek}
                        className="w-full h-1 accent-green-500 cursor-pointer"
                    />

                    <button
                        onClick={togglePlayPause}
                        className="ml-3 bg-black/70 text-white rounded-full p-2 hover:bg-black/90 transition"
                    >
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                    </button>
                </div>
            </div>

            {/* Mini-player (only if video was viewed at least once) */}
            {isMiniPlayer && wasViewed && !hideMini && (
                <div className="fixed bottom-4 left-4 w-64 h-36 rounded-lg overflow-hidden shadow-2xl border border-gray-300 bg-black z-50">
                    <video
                        ref={miniVideoRef}
                        src={videoprocess}
                        className="w-full h-full object-cover"
                        muted
                        defaultMuted
                        playsInline
                        loop
                        autoPlay
                    />
                    <div className="absolute bottom-2 right-2 flex gap-2">
                        <button
                            onClick={toggleMiniPlayPause}
                            className="bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        </button>
                        <button
                            onClick={() => setHideMini(true)}
                            className="bg-black/60 text-white rounded-full p-2 hover:bg-black/80"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
